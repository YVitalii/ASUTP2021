const ClassIface = require("./class_RS485_iface_real.js");

const dummy = require("../tools/dummy.js").dummyPromise;
const EventEmitter = require("events");
const APIerror = require("../tools/apiError.js");
class ClassRS485Emulator extends ClassIface {
  constructor(path = "fakeCOM", props = {}, timeout = 300) {
    let trace = 0,
      ln = __filename + "::constructor()::";

    props.id += "fake";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    super((path = "fakeCOM"), props);
    this.path = path;
    this.isOpened = false;
    // емуляція серійного порту
    this.serial = new EventEmitter();
    this.serial.isOpen = false;
    this.serial.open = function (cb) {
      this.isOpened = true;
      process.nextTick(function () {
        cb(null);
      });
    };
    this.serial.write = function (msg, cb) {
      process.nextTick(function () {
        cb(null);
      });
    };
    this.serial.close = function (cb) {
      this.isOpened = false;
      process.nextTick(function () {
        cb(null);
      });
    };
    this.iterate = () => {};
    this.devices = [];
  }

  addDevice(addr, dev) {
    let err = this.checkAddress(addr);
    if (err != null) throw err;
    if (this.devices[addr]) {
      err = new APIerror(
        {
          ua: `Прилад уже визначений`,
          en: `Device already defined`,
          ru: `Устройство уже определено`,
        },
        (code = 0),
        (prefix = this.ln),
        (suffix = `devices[${adr}].id=${this.devices[addr].id}`)
      );
      throw new Error(err);
    }

    if (typeof dev.send != "function") {
      err = new APIerror(
        {
          ua: `Прилад повинен мати визначену функцію`,
          en: `Device must have function`,
          ru: `Устройство должно реализовывать функцию`,
        },
        (code = 0),
        (prefix = this.ln),
        (suffix = ` send(err,cb) -> devices[${adr}].send=${typeof this.devices[
          addr
        ].send}`)
      );
      throw new Error(err);
    }
    // add device to list
    this.devices[addr] = dev;
  }

  async openPort() {
    await dummy(1000);
    this.isOpened = true;
    console.log("Emulator port opened");
  }
  /**
   * Перевіряє адреси на сумісність 0-broadcost address
   * @param {Number} addr
   * @returns
   */
  checkAddress(addr) {
    let err = null,
      min = 0,
      max = 247;
    if (
      typeof req.id === "undefined" ||
      isNaN(parseInt(req.id)) ||
      req.id < min ||
      req.id > max
    ) {
      err = new APIerror(
        {
          ua: `Адреса пристрою повинна бути в межах`,
          en: "Device address must be in range",
          ru: `Адрес устройства должен быть в диапазоне`,
        },
        (code = 0),
        (prefix = this.ln),
        (suffix = ` [${min}..${max}] -> [req.addr=${req.addr}]`)
      );
    }
    return err;
  } // checkAddress

  /**
   * функція імітує запит
   * @typedef {Object} req - запит RS485
   * @property {Number} id - адреса пристрою в мережі RS485 [1..254]
   * @property {Number} FC - функція, наразі реалізовано FC=[3,6,10]
   * @property {Number} addr - адрес початкового регістру
   * @property {Number | Buffer } data - дані для передачі
   * @property {Number} timeout - ms, час очікування відповіді
   * @return {callback} (err,data) = >
   * @typedef {Object} data - отримані дані
   */
  send(req = {}, cb) {
    let trace = 0,
      ln =
        this.ln +
        `send(id=${req.id};FC=${req.FC};addr=${req.addr};data
          ${req.data}
        )})::`;
    trace ? log(ln, `Started!`) : null;
    let err = this.checkAddress(req.addr);
    if (err != null) {
      cb(err, null);
      return;
    }
    let dev = this.devices[addr];
    if (!dev) {
      let msg = this.ln + "Device already not defined!";
      throw (err = new APIerror(
        {
          ua: `Пристрій ще не визначений`,
          en: "Device not defined yet",
          ru: `Устройство еще не определено`,
        },
        (code = 0),
        (prefix = this.ln),
        (suffix = ` [req.addr=${req.addr}]`)
      ));
    }
    dev.send(req, (err, data) => {
      cb(err, dev.value);
    }); // send()

    // process.nextTick(function () {
    //   cb(null);
    // });

    // process.nextTick(() => {
    //   let err = null,
    //     data = req.data;
    //   // console.log("this=");
    //   // console.dir(this);
    //   if (!this.isOpened) {
    //     err = new Error("Port is closed");
    //     err.code = "PortClosed";
    //     err.messages = {
    //       ua: `Помилка timeout`,
    //       en: `Timeout error`,
    //       ru: `Ошибка Timeout.`,
    //     };
    //     data = null;
    //   }
    //   cb(err, data);
    // });
  }
}

module.exports = ClassRS485Emulator;

if (!module.parent) {
  //виконується, якщо модуль викликано окремо, а не імпортовано (в командному рядку)
  let trace = 1,
    ln = __filename + `::`;
  let iface = new ClassRS485Emulator("COM3", { id: "w2", baudRate: 9600 });
  if (trace) {
    console.log(ln + `iface=`);
    console.dir(iface);
  }
}
