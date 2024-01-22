const log = require("../../tools/log");
const ClassRegister = require("../regsController/ClassRegister");

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

    // список регістрів
    this.regs = props.regs ? props.regs : {};

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } //constructor
} //class ClassTask

module.exports = ClassTask;
