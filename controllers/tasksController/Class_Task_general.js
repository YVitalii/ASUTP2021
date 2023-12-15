const log = require("../../tools/log");

class ClassTask {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    this.ln = "ClassTaskGeneral()::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    // Тут мають зберігатися регістри класу
    this.regs = {};
    this.type = {
      id: "undefined",
      title: { ua: `undefined`, en: `undefined`, ru: `undefined` },
    };
    if (props.type) {
      this.type.id = props.type.id ? props.type.id : this.type.id;
      this.type.title = props.type.title ? props.type.title : this.type.title;
    }
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }
} //class ClassThermoStep

module.exports = ClassTask;
