const ClassIface = require("./class_RS485_iface_real.js");
const ClassGeneral = require("../ClassGeneral.js");
const dummy = require("../tools/dummy.js").dummyPromise;
const EventEmitter = require("events");

class ClassRS485Emulator extends ClassIface {
  constructor(path = "fakeCOM", props = {}, timeout = 300) {
    let trace = 1,
      ln = __filename + "::constructor()::";

    props.id = "fakeRS485";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    super(props);
    this.path = path;
    this.isOpened = false;
    // емуляція серійного порту
    this.serial = new EventEmitter();
    this.serial.isOpen = false;
    this.serial.open = function (cb) {
      this.isOpen = true;
      process.nextTick(function () {
        cb(null);
      });
    };
    this.serial.write = function (msg, cb) {
      process.nextTick(function () {
        cb(null, { data: msg });
      });
    };
    this.serial.close = function (cb) {
      this.isOpen = false;
      process.nextTick(function () {
        cb(null);
      });
    };
    this.iterate = () => {};
  }
  async openPort() {
    await dummy(1000);
    this.isOpened = true;
  }

  /**
   * функція імітує запит
   * @typedef {Object} req - запит RS485
   * @property {Number} id - адреса пристрою в мережі [1..254]
   * @property {Number} FC - функція, наразі реалізовано FC=[3,6,10]
   * @property {Number} addr - адрес початкового регістру
   * @property {Number | Buffer } data - дані для передачі
   * @property {Number} timeout - ms, час очікування відповіді
   * @return {callback} (err,data) = >
   * @typedef {Object} data - отримані дані
   */
  send(req = {}, cb) {
    req.id = req.id ? req.id : 33;
    req.FC = req.FC ? req.FC : 3;
    req.addr = req.addr ? req.addr : 33;
    req.data = req.data ? req.data : Buffer.from(["f", "a", "k", "e"]);
    req.timeout = req.timeout ? req.timeout : 1000;
    let trace = 0,
      ln =
        this.ln +
        `send(id=${req.id};FC=${req.FC};addr=${req.addr};data=${parseBuf(
          req.data
        )})::`;
    trace ? log(ln, `Started!`) : null;
    setTimeout(() => {
      cb(null, req.data);
    }, req.timeout);
  }
}

const iface = new ClassRS485Emulator("fakeCOM", {
  id: "w2",
  header: {
    ua: `Емулятор RS485`,
    en: `Emulator for RS485`,
    ru: `Эмулятор RS485`,
  },
  timeoutBetweenCalls: 500,
});

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
