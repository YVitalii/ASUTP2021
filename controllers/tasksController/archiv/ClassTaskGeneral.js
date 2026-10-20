const log = require("../../tools/log");
const ClassReg_regsList = require("../regsController/ClassReg_regsList");

class ClassTaskGeneral extends ClassReg_regsList {
  /**
   * Конструктор класу, оптимізованого під роботу з задачами
   * 2023-03-14 поки нічого не робить
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    super(props);
    this.ln = this.ln ? this.ln : "Class_Task_general()::";
    let trace = 0,
      ln = this.ln + "constructor()::";

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this, { depth: 3 });
    }
  } //constructor
} //class ClassTask

module.exports = ClassTaskGeneral;
