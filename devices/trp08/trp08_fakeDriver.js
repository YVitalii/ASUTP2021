const realDriver = require("./makeNewDriverFromOld.js");
const makeFake = require("../classDeviceGeneral/makeFakeDriver.js");
const ClassFurnaceEmulator = require("../furnaceModel/ClassFurnaceModel.js"); // на 2025-11-18 furnaceModel_TransferF.js потребує доробки
const ClassPIDregulator = require("../../controllers/PID/ClassPIDregulator.js");

/**
 * Модифікує драйвер, щоб він імітував роботу печі
 * @param {Object} props
 * @param {Number} props.minT=0 - мінімальна температура печі для PID inputRange
 * @param {Number} props.maxT=500 - максимальна температура печі для PID inputRange
 * @param {Object} props.furnace - модель печі параметри див.: /devices/furnaceModel/ClassFurnaceModel.js
 * @param {Number} props.furnace.heatCapacity = 30±10
 * @param {Number} props.furnace.deadTime = 10±2
 * @param {Object} props.pid - ПІД-регулятор параметри
 * @param {Number} props.pid.inputRange={min:props.minT,max:props.maxT} - допустимий діапазон температур
 */

function makeFakeTrp08(driver, props = {}) {
  let trace = 0,
    ln = driver.ln + `makeFakeTrp08()::`;
  // підміняємо методи фальшивими методами
  makeFake(driver);
  if (trace) {
    console.log(ln + `props=`);
    console.dir(props);
  }
  driver.ln = driver.id + "(fake)::";

  trace ? console.log(ln + `makeFake(driver) completed ! `) : null;
  //   console.log(ln + "" + driver.setReg.toString());
  // запамятовуємо максимальну температуру
  driver.maxT = props.maxT;
  driver.minT = props.minT;
  // --------------- створюємо модель печі ------------
  let propsFurnace = props.furnace
    ? props.furnace
    : {
        // випадковим чином змінюємо параметр часу
        // щоб отримати близькі але не однакові характеристики печей
        // Math.floor(Math.random() * (max - min + 1)) + min
        heatCapacity:
          2000 *
          (1 -
            Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
        power:
          7000 *
          (1 -
            Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
        ln: driver.id + "::furnace::",
      };
  let furnace = new ClassFurnaceEmulator(propsFurnace);
  driver.furnace = furnace;

  // ------------ PID-регулятор -------------
  // ------------ використовується для управління моделлю печі -------
  let propsPid = props.pid
    ? props.pid
    : {
        id: driver.id + "_PID",
        inputRange: {
          min: props.minT ? props.minT : 0,
          max: props.maxT ? props.maxT : 500,
        },
        ln: driver.id + "::PID::",
      };
  // поточна температура для pid береться з приладу

  propsPid.getPV = async function () {
    return new Promise((resolve, reject) => {
      let trace = 0,
        ln = driver.id + `.pid.getPV()::`;
      trace ? console.log("i", ln, `Started`) : null;
      let t = furnace.getTSync();
      trace ? console.log("i", ln, `Returning currentTemperature=${t}`) : null;
      resolve(t);
    });
  };

  // поточна потужність передається в модель печі
  propsPid.setOutput = async (pow) => {
    await furnace.setPower(pow);
  };

  // ------------ створюємо модель PID-регулятора -------------
  let pid = new ClassPIDregulator(propsPid);
  driver.pid = pid;
  // встановлюємо PID-регулятор як регулятор за замовчуванням (можливо ПОЗ/ПІД)
  driver.regulator = pid;
  driver.regMode = "PID";
  driver.regs.get("regMode").value = 1; // PID-регулювання
  // потрібно розробити модель ПОЗ регулятора

  // --------  tT ----------
  driver.regs.get("tT").value = 0;
  driver.regs.get("tT")._set = (val) => {
    // при записі в регістр приладу tT - передаємо значення в модель ПИД-регулятора
    // console.log(`driver.regs.get("tT")._set(${val})::Started;`);
    // console.log("pid=");
    // console.dir(pid);
    pid.setPoint = val;
    return val;
  };

  // ------- start/stop ----------
  driver.regs.get("state")._set = (val) => {
    if (val == 17) {
      //start
      pid.start();
      // режим Пуск
      return 23;
    }
    if (val == 1) {
      //stop
      pid.stop();
      //режим Стоп
      return 7;
    }
    throw new Error(
      `Not compatible value for register/ Can be 17-start or 1=stop? but received [${val}]`
    );
    // console.log(`driver.regs.get("tT")._set(${val})::Started;`);
    // console.log("pid=");
    // console.dir(pid);
  };

  // --- робота з температурою -----------
  // поточна температура для приладу береться з моделі печі
  driver.regs.get("T").get_ = () => furnace.getTSync();

  // ---- закон регулювання ------
  driver.regs.get("regMode").set_ = (val) => {
    if (val == 1 || val == "pid" || val == "PID") {
      // PID-регулювання
      this.regulator = pid;
      this.regMode = "PID";
      return 1;
    }
    if (val == 2 || val == "pos" || val == "POS") {
      // POS-регулювання - не реалізовано
      let msg = {
        ua: `Позиційне регулювання ще не реалізовано`,
        en: `POS-regulation mode is not implemented yet!`,
        ru: ``,
      };
      let err = new Error(msg.en); //в тестах перевіряється на англійській: /not implemented/
      err.messages = msg;
      throw err;
    }
    return val;
  };
  // ---- пропорційна складова / неузгодження  ------
  driver.regs.get("o").set_ = (val) => {
    if (driver.regMode == "PID") {
      driver.pid.kp = val / 10;
      return val;
    }
    throw new Error("Only PID-regulation mode is implemented yet!");
  };

  // ---- PID інтегральна складова   ------
  driver.regs.get("ti").set_ = (val) => {
    // console.log(
    //   ln + `ti.set_(${val}):: called:: driver.regMode=${driver.regMode}`
    // );
    if (driver.regMode == "PID") {
      driver.pid.ki = val / 100;
    }
    // для ПОЗ регулювання не має сенсу
    return val;
  };

  // ---- PID диференційна складова   ------
  driver.regs.get("td").set_ = (val) => {
    if (driver.regMode == "PID") {
      driver.pid.kd = val / 100;
    }
    // для ПОЗ регулювання не має сенсу
    return val;
  };
  trace = 0;
  if (trace) {
    console.log(ln + `After make Fake:: driver=`);
    console.dir(driver, { depth: 1 });
  }

  return driver;
}

module.exports = makeFakeTrp08;
