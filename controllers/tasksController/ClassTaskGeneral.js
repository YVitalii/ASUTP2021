const log = require("../../tools/log");
const ClassReg_regsList = require("../regsController/ClassReg_regsList");
const myError = require("../../tools/myError");

class ClassTaskGeneral extends ClassReg_regsList {
  /**
   * Конструктор класу, оптимізованого під роботу з задачами
   * 2023-03-14 поки нічого не робить
   * @param {Object} props
   *
   */

  constructor(props = {}) {
    props.ln = props.ln ? props.ln : "Class_Task_general()::";
    super(props);

    let trace = 0,
      ln = this.ln + "constructor()::";

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this, { depth: 3 });
    }
  } //constructor

  // фунція повертає опис задачі на основі внутрішніх даних класу
  getState() {
    myError({
      ua: `Метод getState() не реалізований у класі ${this.ln}`,
      en: `The getState() method is not implemented in class ${this.ln}`,
      ru: `Метод getState() не реализован в классе ${this.ln}`,
    });
  }

  /**
   * Створює та повертає крок термообробки
   * для ProcessManagera на основі списку регістрів задачі
   * @param {} regs
   * @returns
   */
  getStep(regs) {
    myError({
      ua: `Метод getStep() не реалізований у класі ${this.ln}`,
      en: `The getStep() method is not implemented in class ${this.ln}`,
      ru: `Метод getStep() не реализован в классе ${this.ln}`,
    });
  }

  /**
   * Повертає копію this.reg для рендерингу сторінки
   * видаляє непотрібні зовні поля
   */
  getRegForHTML() {
    // повертає список регістрів задачі для відображення в HTML
    myError({
      ua: `Метод getRegForHTML() не реалізований у класі ${this.ln}`,
      en: `The getRegForHTML() method is not implemented in class ${this.ln}`,
      ru: `Метод getRegForHTML() не реализован в классе ${this.ln}`,
    });
  }
} //class ClassTask

module.exports = ClassTaskGeneral;
