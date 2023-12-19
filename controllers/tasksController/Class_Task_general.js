const log = require("../../tools/log");
const ClassRegister = require("../ClassRegister");

class ClassTask extends ClassRegister {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    super(props);
    this.ln = "Class_Task_general()::";
    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    // Тип задачі
    this.type = "task";
    this.id = this.type;

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }
} //class ClassTask

module.exports = ClassTask;
