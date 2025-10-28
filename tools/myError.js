const log = require("./log");

class errorHandler extends Error {
  constructor(msg = {}) {
    let ln = this && this.ln ? this.ln : `errorHandler::`;
    this.ln = "errorHandler::";
    let errMsg = err.ua
      ? msg
      : { ua: "Без повідомлення", en: "Without message", ru: "Без сообщения" };
    for (const key in errMsg) {
      if (!Object.hasOwn(errMsg, key)) continue;
      errMsg[key] = ln + errMsg[key];
    } // for
    log("e", ln, errMsg.ua);
    let err = new Error(errMsg.ua);
    err.messages = errMsg;
    throw err;
  }
  create() {}
}

module.exports = errorHandler;
