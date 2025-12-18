class APIerror extends Error {
  /**
   * Розширює стандартну помилку
   * @param {Object} msg = {ua,en,ru}
   * @param {Number} code=0 - код помилки
   * @param {String} prefix="" - префікс до повідомлення: msg[i] = prefix + msg[i] + sufix
   * @param {String} suffix="" - суфікс до повідомлення
   */
  constructor(msg, code = 0, prefix = "", suffix = "") {
    if (!msg || !msg.ua) {
      throw newError("Messages must be defined!");
    }
    for (const key in msg) {
      if (!Object.hasOwn(msg, key)) continue;
      msg[key] = prefix + msg[key] + suffix;
    }
    super(msg.en); // (1)
    this.name = "APIerror"; // (2)
    this.msg = msg;
    this.code = code;
  }
}

module.exports = APIerror;

if (!module.parent) {
  throw new APIerror({ en: "a Error", ru: "Ошибка", ua: "Сталася помилка" });
}
