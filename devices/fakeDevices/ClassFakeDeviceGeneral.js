const GeneralClass = require("../../ClassGeneral");
const apiError = require("../../tools/apiError");
const toTetrad = require("../../tools/CRC").toTetrad;

class ClassFakeDeviceGeneral extends GeneralClass {
  constructor(props) {
    super(props);
    // масив що зберігання фейкових регістрів
    this.regs = [];
  } // constructor

  /**
   * функція імітує роботу реальної функції send()
   * @param {object} req - запит має містити {addr=1..247,FC,addr,data} опис див. class_RS485_iface_real.save
   * @param {Boolean} err=false - примусова генерація помилки = true
   * @return {callback} cb - callback {err:null/apiErr,data=Buffer/null}
   */
  send(req, cb) {
    // якщо запит на генерування помилки вручну, то повертаємо її
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
    // якщо регістр не знайдений, помилка
    if (!this.regs[req.addr]) {
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
    }
  }
}

module.exports = ClassFakeDeviceGeneral;
