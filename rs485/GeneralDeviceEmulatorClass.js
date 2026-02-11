/**
 * @typedef {Object} DeviceEmulatorRegister
 * @property {number} addr - Адреса регістра.
 * @property {number} _value - Поточне значення регістра.
 * @property {function} value.get() - Метод для отримання поточного значення регістра.
 * @property {function} value.set(val) - Метод для встановлення нового значення регістра.
 */

/**
 * @typedef {Object} GeneralDeviceEmulator
 * @property {Map} regs - Карта регістрів пристрою, де ключ - адреса регістра, а значення - його поточне значення.
 * @property {function} getReg - Метод для отримання значення регістра за його адресою.
 * @property {function} hasReg - Метод для перевірки наявності регістра за його адресою.
 * @property {function} write - Абстрактний метод для запису даних у пристрій, який повинен бути реалізований у підкласах.
 */

/**
 * Description placeholder
 *
 * @class GeneralDeviceEmulator
 * @typedef {GeneralDeviceEmulator}
 * @extends {require("../ClassGeneral")}
 */

class GeneralDeviceEmulator extends require("../ClassGeneral") {
  constructor(props = {}) {
    props.id = props.id || "GeneralDeviceEmulator";
    super(props);
    this.regs = new Map();
  } // сonstructor

  getReg(addr) {
    return this.hasReg(addr) ? this.regs.get(addr) : null;
  }

  hasReg(addr) {
    return this.regs.has(addr);
  }

  /**
   * Реєструє новий регістр у емуляторі пристрою.
   * @param {DeviceEmulatorRegister} reg
   */

  addReg(reg = {}) {
    if (reg.addr === undefined) {
      throw new Error(
        this.ln + "addReg():: reg object with 'addr' property is required",
      );
    }
    if (this.hasReg(reg.addr)) {
      throw new Error(
        this.ln +
          `addReg():: Register with address ${reg.addr} already exists!`,
      );
    }
    this.regs.set(reg.addr, reg);
  }

  async write(data) {
    throw new Error(ln + `write() method not implemented!`);
  }

  error(data, errorN = 9) {}

  /**
   * Метод для обробки команди FC3 (читання регістрів)
   * @param {Buffer} data - Вхідні дані, які містять адресу та кількість регістрів для читання
   * @returns {Buffer}
   */
  FC3(data) {
    let trace = 1,
      ln = this.ln + `FC3()::`;
    let firstRegAddr = data.readUInt16BE(2); // Адреса першого регістра
    let regCount = data.readUInt16BE(4); // Кількість регістрів для читання
    if (trace) {
      console.log(
        ln +
          `Request to read ${regCount} registers starting from address ${firstRegAddr}`,
      );
    }
    let response = Buffer.alloc(1 + regCount * 2); // 1 байт для кількості байтів даних + 2 байти на кожен регістр
    response.writeUInt8(regCount * 2, 0); // Записуємо кількість байтів даних у перший байт відповіді
    for (let i = 0; i < regCount; i++) {
      let regAddr = firstRegAddr + i;
      let regValue = this.getReg(regAddr);
      if (regValue === null) {
        regValue = 0; // Якщо регістр не існує, повертаємо 0
      }
      response.writeUInt16BE(regValue, 1 + i * 2); // Записуємо значення регістра у відповідь
    }
    if (trace) {
      console.log(ln + `Response data:`);
      console.dir(response, { depth: 1 });
    }
  }
}

module.exports = GeneralDeviceEmulator;
