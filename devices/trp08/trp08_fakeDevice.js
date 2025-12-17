// cd ./devices/trp08
// supervisor  --extensions 'js,pug' --timestamp --no-restart-on exit ./trp08_fakeDevice.js

// емулює роботу ТРП-08-ТП на базі моделі печі та ПІД-регулятора
// повинен підключатися через емулятор RS485 через менеджер DeviceEmulator
// повністю емітує роботу терморегулятора по інтерфейсу RS485

const FurnaceModel = require("../furnaceModel/ClassFurnaceModel.js");
const ClassPIDregulator = require("../../controllers/PID/ClassPIDregulator.js");
const crc16 = require("../../tools/CRC.js");
let ClassGeneral = require("../../ClassGeneral.js");

class ClassFakeTRP extends ClassGeneral {
  /**
   *
   * @param {Object} props
   * @param {Object} props.furnace - параметри моделі печі дивись devices\furnaceModel\ClassFurnaceModel.js
   * @param {Number} props.furnace.heatCapacity=2000±15% - Дж/°С теплоємність печі
   * @param {Number} props.furnace.heatCapacity=7000±15% - Вт=Дж/с потужність нагрівачів
   * @param {Number} props.minT - мінімальна температура
   * @param {Number} props.maxT - максимальна температура
   *
   */
  constructor(props = {}) {
    super(props);
    // --------------- створюємо модель печі ------------
    let f = props.furnace ? props.furnace : {};
    // випадковим чином змінюємо параметр часу
    // щоб отримати близькі але не однакові характеристики печей
    // Math.floor(Math.random() * (max - min + 1)) + min
    let furnaceProps = {
      id: props.id + "_furnace",
      heatCapacity: f.heatCapacity
        ? f.heatCapacity
        : 2000 *
          (1 -
            Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
      power: f.power
        ? f.power
        : 7000 *
          (1 -
            Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
      ln: props.id + "::furnace::",
    };
    this.furnace = new FurnaceModel(furnaceProps);
    // ------------ PID-регулятор -------------
    // ------------ використовується для управління моделлю печі -------
    let p = props.pid ? props.pid : {};
    let pidProps = {
      id: props.id + "_pid",
      ln: props.id + "::pid::",
      inputRange: {
        min: props.minT ? props.minT : 0,
        max: props.maxT ? props.maxT : 500,
      },
      // поточна температура для pid береться з моделі печі
      getPV: async function () {
        return new Promise((resolve, reject) => {
          let trace = 0,
            ln = driver.id + `.pid.getPV()::`;
          trace ? console.log("i", ln, `Started`) : null;
          let t = this.furnace.getTSync();
          trace
            ? console.log("i", ln, `Returning currentTemperature=${t}`)
            : null;
          resolve(t);
        });
      },
      // поточна потужність передається в модель печі
      setOutput: async (pow) => {
        await this.furnace.setPower(pow);
        return pow;
      },
    }; //
    this.pid = new ClassPIDregulator(pidProps);
    this.regs = [];
    // ---- state ----
    this.regs[0] = {
      id: "state",
      set: function (value) {
        if (value == 17) {
          this.pid.start(0);
          this.regs[0].value = 23;
        }
        if (value == 17) {
          this.pid.start(0);
          this.regs[0].value = 23;
        }

        this.regs[0].value = value;
      },
      get: function (v) {
        return this.regs[0].value;
      },
    };
  }
  /**
   * імітує запит в прилад
   * @param {Object} req  - аналогічний до аргументу функції class_RS485_iface_real.send()
   * {id,FC,addr,data,timeout}
   * @return {callback} cb = function (err,data) = return  data ={note,value}
   */
  send(req, cb) {
    if (!this.regs[req.addr]) {
      cb(this.ln + "ILLEGAL DATA ADDRESS", null);
    }
    // повертаємо буфер з результатом [Hi,Lo]
    switch (req.FC) {
      case 3:
        cb(null, this.regs[req.addr]);
        return;
      case 6:
        cb(null, crc16.toTetrad((this.regs[req.addr] = req.data)));
        return;
      default:
        cb(this.ln + "ILLEGAL FUNCTION", null);
        return;
    }
  }
}
module.exports = ClassFakeTRP;

if (require.main === module) {
  //виконується, якщо модуль викликано окремо, а не імпортовано (в командному рядку)
  let trace = 1,
    ln = `${__filename}::`;
  let device = new ClassFakeTRP({ id: "z1_top", maxT: 1000 });
  if (trace) {
    console.log("i", ln, `device=`);
    console.dir(device);
  }
}
