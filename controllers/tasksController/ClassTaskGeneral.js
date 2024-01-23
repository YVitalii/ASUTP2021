const log = require("../../tools/log");
const ClassReg_regsList = require("../regsController/ClassReg_regsList");

class ClassTaskGeneral extends ClassReg_regsList {
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
      console.dir(this, { depth: 3 });
    }
  } //constructor
} //class ClassTask

module.exports = ClassTaskGeneral;
