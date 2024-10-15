const ClassIface = require("./class_RS485_iface");
const ClassGeneral = require("../ClassGeneral");
const dummy = require("../tools/dummy.js").dummyPromise;

class ClassRS485Emulator extends ClassGeneral {
  constructor(path, props) {
    super(props);
    this.path = path;
    this.isOpened = false;
    this.openPort();
  }
  async openPort() {
    await dummy(2000);
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
  send(req, cb) {
    // налаштування трасувальника
    let trace = 0,
      ln =
        this.ln +
        `send(id=${req.id};FC=${req.FC};addr=${req.addr};data=${parseBuf(
          req.data
        )})::`;
    trace ? log(ln, `Started!`) : null;
    setTimeout(() => {
      cb(null, data);
    }, timeout);
  }
}

const iface = new ClassRS485Emulator("COMsim", {
  id: "w2",
  header: {
    ua: `Емулятор RS485`,
    en: `Emulator for RS485`,
    ru: `Эмулятор RS485`,
  },
  timeoutBetweenCalls: 500,
});

module.exports = iface;

if (!module.parent) {
  console.log("iface=");
  console.dir(iface, { depth: 2 });
}
