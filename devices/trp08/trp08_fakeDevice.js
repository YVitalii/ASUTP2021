// cd ./devices/trp08
// supervisor  --extensions 'js,pug' --timestamp --no-restart-on exit ./trp08_fakeDevice.js

// емулює роботу ТРП-08-ТП на базі моделі печі та ПІД-регулятора
// повинен підключатися через емулятор RS485 через менеджер DeviceEmulator
// повністю емітує роботу терморегулятора по інтерфейсу RS485

const FurnaceModel = require("../furnaceModel/ClassFurnaceModel.js");
const ClassPIDregulator = require("../../controllers/PID/ClassPIDregulator.js");
const crc16 = require("../../tools/CRC.js");
let ClassGeneral = require("../../ClassGeneral.js");
const { toBCD, fromBCD } = require("./driverOld.js");
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
    // ------------- емуляція регістрів позиція в масиві = адресі регістру---------------
    this.regs = new Map();
    // ---- state ----
    this.regs.set(0, {
      id: "state",
      parent: this,
      addr: 0,
      set value(value) {
        console.log("this=");
        console.dir(this);
        // let reg = this.regs.get(0);
        if (value == 17) {
          this.parent.pid.start();
          this._value = 23;
        }
        if (value == 1) {
          this.parent.pid.stop();
          this._value = 7;
        }
      },
      get value() {
        let val = toBCD(this._value);
        val = crc16.toTetrad(val);
        return val;
      },
      _value: 1,
    });
  }
  /**
   * імітує запит в прилад
   * @param {Object} req  - аналогічний до аргументу функції class_RS485_iface_real.send()
   * {id,FC,addr,data,timeout}
   * @return {callback} cb = function (err,data) = return  data ={note,value}
   */
  send(req, cb) {
    // ---- якщо регістра за цією адресою немає - помилка
    if (!this.regs.has(req.addr)) {
      cb(new Error(this.ln + "ILLEGAL DATA ADDRESS"), null);
    }
    let reg = this.regs.get(req.addr);
    // повертаємо буфер з результатом [Hi,Lo]
    switch (req.FC) {
      case 3:
        cb(null, reg.value);
        return;
      case 6:
        reg.value = req.data;
        cb(null, crc16.toTetrad(reg.value));
        return;
      default:
        cb(new Error(this.ln + "ILLEGAL FUNCTION"), null);
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
