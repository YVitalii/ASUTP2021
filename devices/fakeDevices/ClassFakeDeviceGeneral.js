const GeneralClass = require("../../ClassGeneral");
const apiError = require("../../tools/apiError");
const toTetrad = require("../../tools/CRC").toTetrad;

/**
 * @typedef {Object} fakeDeviceRegister
 * @property {String} id - id-регістра
 * @property {Number} _value - поточне значення регістра
 * @property {Number} value  - змінна для зовнішнього застосування
 * @property {Number} get value() - імітує отримання даних по rs485, повинна повертати значення регістра
 * @property {Number} set value(v) - імітує запис даних по rs485, повинна встановлювати значення регістра
 */

class ClassFakeDeviceGeneral extends GeneralClass {
  constructor(props) {
    super(props);
    // масив для зберігання фейкових регістрів
    // номер елемента в цьому масиві = адресу регістра
    // формат регістр має бути типу fakeReg
    this.regs = [];
  } // constructor

  /**
   * функція імітує роботу реальної функції iface.send() та викликається fakeIface
   * @param {object} req - запит має містити {addr=1..247,FC,addr,data} опис див. class_RS485_iface_real.save
   * @param {Boolean} err=false - примусова генерація помилки = true
   * @return {callback} cb - callback {err:null/apiErr,data=Buffer/null}
   */
  send(req, cb) {
    // якщо є запит на генерування помилки вручну, то повертаємо помилку
    if (req.err) {
      let msg = `Manual generated error `;
      let err = new apiError(
        { ua: msg, en: msg, ru: msg },
        0,
        (prefix = this.ln),
        (suffix = `req.err=true`)
      );
      cb(err, null);
      return;
    }
    // шукаємо регістр в масиві
    let reg = this.regs[req.addr];
    // якщо регістр не знайдений, помилка
    if (!reg) {
      let err = new apiError(
        {
          ua: "Невірна адреса регістру",
          en: "ILLEGAL DATA ADDRESS",
          ru: "Неправильный адрес регистра",
        },
        1,
        (prefix = this.ln),
        (suffix = `: req.addr=${addr}`)
      );
      cb(err, null);
      return;
    } //if (!this.regs[req.addr])
    // регістр знайдено

    return { err: null, data: reg.value };
  } // send()
}

module.exports = ClassFakeDeviceGeneral;
