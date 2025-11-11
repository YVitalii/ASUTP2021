const realDriver = require("./makeNewDriverFromOld.js");
const makeFake = require("../classDeviceGeneral/makeFakeDriver.js");
const ClassFurnaceEmulator = require("../furnaceModel/furnaceModel_TransferF.js");
const ClassPIDregulator = require("../../controllers/PID/ClassPIDregulator.js");

/**
 * Модифікує драйвер, щоб він імітував роботу печі
 * @param {Object} props
 * @param {Number} props.minT=0 - мінімальна температура печі для PID inputRange
 * @param {Number} props.maxT=500 - максимальна температура печі для PID inputRange
 * @param {Object} props.furnace - модель печі параметри
 * @param {Number} props.furnace.timeConstant = 30±10
 * @param {Number} props.furnace.deadTime = 10±2
 * @param {Object} props.pid - ПІД-регулятор параметри
 * @param {Number} props.pid.inputRange={min:props.minT,max:props.maxT} - допустимий діапазон температур
 */

function makeFakeTrp08(driver, props = {}) {
  let trace = 0,
    ln = driver.ln + `::makeFakeTrp08()::`;
  // підміняємо методи фальшивими методами
  makeFake(driver);

  trace ? console.log(ln + `makeFake(driver) completed ! `) : null;
  //   console.log(ln + "" + driver.setReg.toString());
  // створюємо модель печі
  props.furnace = props.furnace
    ? props.furnace
    : {
        // випадковим чином змінюємо параметр часу
        // щоб отримати близькі але не однакові характеристики печей
        // Math.floor(Math.random() * (max - min + 1)) + min
        timeConstant: 30 + Math.round(Math.random() * (10 + 10 + 1) - 10),
        deadTime: 10 + Math.round(Math.random() * (2 + 2 + 1) - 2),
        gain: props.maxT * 1.1,
        ln: driver.id + "::furnace::",
      };
  let furnace = new ClassFurnaceEmulator(props.furnace);
  driver.furnace = furnace;

  // ------------ PID-регулятор -------------
  props.pid = props.pid
    ? props.pid
    : {
        id: driver.id + "::pid::",
        inputRange: {
          min: props.minT ? props.minT : 0,
          max: props.maxT ? props.maxT : 500,
        },
      };
  // поточна температура для pid береться з приладу
  props.pid.getPV = async () => {
    await driver.getRegPromise("T");
  };
  props.pid.setOutput = async (pow) => {
    await furnace.setPower(pow);
  };
  // ------------ створюємо модель PID-регулятора -------------
  let pid = new ClassPIDregulator(props.pid);
  driver.pid = pid;
  // --------  tT ----------
  driver.regs.get("tT")._set = (val) => {
    // console.log(`driver.regs.get("tT")._set(${val})::Started;`);
    // console.log("pid=");
    // console.dir(pid);
    pid.setPoint = val;
  };
  // ------- start/stop ----------
  driver.regs.get("state")._set = (val) => {
    if (val == 17) {
      //start
      pid.start();
      return val;
    }
    if (val == 1) {
      //stop
      pid.stop();
      return val;
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
  driver.regs.get("T").get_ = () => furnace.getT();

  if (trace) {
    console.log(ln + `After make Fake:: driver=`);
    console.dir(driver);
  }
  // -- робота з заданою температурою

  return driver;
}

module.exports = makeFakeTrp08;
