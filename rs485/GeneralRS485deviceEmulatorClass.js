const parseBuf = require("../tools/parseBuf");
const dummy = require("../tools/dummy").dummyPromise;
const CRC = require("../tools/CRC");
const DeviceEmulatorRegisterClass = require("./DeviceEmulatorRegisterClass");

/**
 * @typedef {Object} GeneralRS485deviceEmulator
 * @property {Map} regs - Карта регістрів пристрою, де ключ - адреса регістра, а значення - його поточне значення.
 * @property {function} getReg - Метод для отримання значення регістра за його адресою.
 * @property {function} hasReg - Метод для перевірки наявності регістра за його адресою.
 * @property {function} write - Абстрактний метод для запису даних у пристрій, який повинен бути реалізований у підкласах.
 */

/**
 * Description placeholder
 *
 * @class GeneralRS485deviceEmulator
 * @typedef {GeneralRS485deviceEmulator}
 * @extends {require("../ClassGeneral")}
 */

class GeneralRS485deviceEmulator extends require("../ClassGeneral") {
  constructor(props = {}) {
    props.id = props.id || "GeneralRS485deviceEmulator";
    super(props);
    this.regs = new Map();
    this.ids = {};
  } // сonstructor

  getReg(addr) {
    return this.hasReg(addr) ? this.regs.get(addr) : null;
  }

  getRegById(id) {
    if (this.ids[id] != undefined) {
      return this.getReg(this.ids[id]);
    }
    return null;
  }

  hasReg(addr) {
    return this.regs.has(addr);
  }

  /**
   * Реєструє новий регістр у емуляторі пристрою.
   * @param {Object} reg - параметри для створення DeviceEmulatorRegisterClass
   * @param {Number} reg.addr - адреса регістру
   * @param {Number} reg.value - стартове значення регістру
   * @param {String} reg.id="r"+props.addr - ідентифікатор регістру (для людини)
   * @param {String} reg.note - короткий опис регістру (для людини)
   * @param {Function} reg.getR = function() {return this._value} - функція що повинна повертати поточне значення регістра
   * @param {Function} reg.setR(val) = function(val) {return this._value} or throw Error - функція що повинна встановлювати поточне значення регістра,
   *                                при неприйнятному значенні повинна викидати помилку
   */
  addReg(reg = {}) {
    if (reg.addr === undefined) {
      throw new Error(
        this.ln + "addReg():: reg object with 'addr' property is required",
      );
    }

    let trace = 1,
      ln = this.ln + `addReg(${reg.addr}${reg.id ? "[" + reg.id + "]" : ""})::`;
    trace ? console.log(ln + `Started`) : null;

    if (this.hasReg(reg.addr)) {
      throw new Error(
        this.ln +
          `addReg():: Register with address ${reg.addr} already exists!`,
      );
    }

    if (this.ids[reg.id] != undefined) {
      throw new Error(
        this.ln + `addReg():: Register with id ${reg.id} already exists!`,
      );
    }

    this.regs.set(reg.addr, new DeviceEmulatorRegisterClass(this, reg));
    this.ids[reg.id] = reg.addr;
  }

  /**
   * Асинхронна функція приймає повідомлення від інтерфейсу та відповідає на нього
   * @param {Buffer} data  - повідомлення rs485, яке надсилається в лінію
   * @returns {Buffer} відповідь пристрою по rs485
   */
  async write(data, props = {}) {
    let trace = 0,
      ln = this.ln + `write(${parseBuf(data)})::`;
    let FC = data.readUInt8(1),
      resData;
    trace ? console.log(ln + `FC=${FC}`) : null;
    await dummy(1);
    if (FC == 3) {
      resData = this.FC3(data);
    }
    if (FC == 6) {
      resData = this.FC6(data);
    }
    let res = Buffer.concat(
      [Buffer.from([data[0]]), resData],
      resData.length + 1,
    );
    res = Buffer.concat([res, CRC.getCRC(res)], res.length + 2);
    trace ? console.log(ln + `res=${parseBuf(res)}`) : null;
    return res;
    // throw new Error(ln + `write() method not implemented!`);
  }

  ModBusError(data, errorN = 9) {
    let res = Buffer.alloc(1 + 2);
    res[0] = data[1] + 0b10000000;
    res.writeInt16BE(errorN, 1);
    return res;
  }

  /**
   * Метод для обробки команди FC3 (читання регістрів)
   * @param {ModBusData} data - Вхідні дані, повідомлення запиту RS485
   * @returns {Buffer} [FC,countBytes, Hi1,Lo1,Hi2,Lo2...] - буфер
   */
  FC3(data) {
    let trace = 0,
      ln = this.ln + `FC3(${parseBuf(data)})::`;

    let firstRegAddr = data.readUInt16BE(2); // Адреса першого регістра
    let regCount = data.readUInt16BE(4); // Кількість регістрів для читання

    if (trace) {
      console.log(
        ln +
          `Request to read ${regCount} registers starting from address ${firstRegAddr}`,
      );
    }

    let res = Buffer.alloc(regCount * 2),
      error = false;

    for (let i = 0; i < regCount; i++) {
      let reg = this.getReg(firstRegAddr + i);
      if (reg === null) {
        error = true;
        break;
      }
      res.writeUInt16BE(reg.value, i * 2);
    }

    if (error) {
      trace ? console.log(ln + `error=2 регістр недосяжний `) : null;
      return this.ModBusError(data, 2); //регістр недосяжний
    }

    res = Buffer.concat(
      [
        Buffer.from([data[1], res.length]), // функція, кільк.байт
        res, // дані
      ],
      res.length + 2,
    );

    trace ? console.log(ln + `res=${parseBuf(res)}`) : null;
    return res;
  } // FC3

  FC6(data) {
    let trace = 0,
      ln = this.ln + `FC6(${parseBuf(data)})::`;
    let addr = data.readUInt16BE(2);
    let value = data.readInt16BE(4);
    trace
      ? console.log(
          ln + `Start writing reg [0x${addr.toString(16)}] = ${value}`,
        )
      : null;
    let reg = this.getReg(addr),
      res;
    if (reg === null) {
      // unsupported reg
      res = this.ModBusError(data, 2);
      trace ? console.log(ln + `res=${parseBuf(res)}`) : null;
      return res;
    }

    try {
      reg.value = value;
      res = Buffer.copyBytesFrom(data, 1, 5);
    } catch (error) {
      // unsupported data
      console.error(ln + "ERROR::" + error.message);
      res = this.ModBusError(data, 3);
    }
    trace ? console.log(ln + `res=${parseBuf(res)}`) : null;
    return res;
  } // FC6

  FC16(data) {
    let trace = 0,
      ln = this.ln + `FC16(${parseBuf(data)})::`;
    let startAddr = data.readUInt16BE(2),
      quantityRegisters = data.readUInt16BE(4),
      bytesCount = data.readUInt8(6);
    trace
      ? console.log(
          ln +
            `Started. startAddr=${startAddr}; quantityRegisters=${quantityRegisters}; bytesCount=${bytesCount}.`,
        )
      : null;
    let error = false,
      regsCount = 0,
      res;
    for (let i = 0; i < quantityRegisters; i++) {
      const reg = this.getReg(startAddr + i);
      if (reg === null) {
        error = true;
        res = this.ModBusError(data, 2);
        break;
      }
      try {
        reg.value = data.readInt16BE(7 + i * 2);
        regsCount += 1;
        trace
          ? console.log(
              ln + `reg[${reg.addr}].value=${data.readInt16BE(7 + i * 2)}`,
            )
          : null;
      } catch (err) {
        error = true;
        // wrong data
        res = this.ModBusError(data, 3);
        trace ? console.log(ln + `Error=${err}; res=${parseBuf(res)}`) : null;
        break;
      }
    }
    if (!error) {
      // prettier-ignore
      res = Buffer.from([
        data[1], // function
        data[2], data[3], // start register
        CRC.toTetrad(regsCount)[0],CRC.toTetrad(regsCount)[1] // quantity of registers
      ]);
    }
    trace ? console.log(ln + `res=${parseBuf(res)}`) : null;
    return res;
  }
} // class

module.exports = GeneralRS485deviceEmulator;
