const ClassDriverGeneral = require("./ClassDriverGeneral");

class ClassDriverFake extends ClassDriverGeneral {
  constructor(props = {}) {
    super(props);
    this.iface = () => {
      return 1;
    };
  }
  addRegister(props) {
    // якщо props - масив, то додаємо кожен елемент масиву
    if (Array.isArray(props)) {
      let arr = [];
      for (let i = 0; i < props.length; i++) {
        // рекурсивно додаємо кожен елемент масиву
        let res = this.addRegister(props[i]);
        // реєструємо результат
        arr.push(res);
      }
      return arr;
    }
    props._set =
      typeof props._set == "function"
        ? props._set
        : () => {
            return true;
          };
    props.set_ =
      typeof props.set_ == "function"
        ? props.set_
        : () => {
            return true;
          };
    props._get =
      typeof props._get == "function"
        ? props._set
        : () => {
            return true;
          };
    props.get_ =
      typeof props.get_ == "function"
        ? props.get_
        : (val) => {
            return val;
          };
    super.addRegister(props);
  } // addRegister
  getReg(iface = 0, addr = 0, regName, cb) {
    let trace = 0,
      ln = this.ln + `getReg(${iface.id},${addr},${regName})::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.testRequest(this.iface, regName, addr); // посилання на регістр
    let req = { timeout: new Date().getTime() };
    let res = { regName, value: null, detail: { request: "fake driver" } };
    if (this.offline) {
      let messages = {
        ua: `Помилка timeout`,
        en: `Timeout error`,
        ru: `Ошибка Timeout.`,
      };
      let err = new Error(messages.ua);
      err.code = 13;
      err.messages = messages;
      return cb(err, res);
    } else {
    }
  }
}

module.exports = ClassDriverFake;
