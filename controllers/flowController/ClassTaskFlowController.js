const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral");
const ClassStepFlowController = require("./ClassStepFlowController");
const clone = require("clone");

/**
 * Клас зберігає загальний опис контролеру потоку
 * Використовується для надання інформації про регістри в ProgramEditor
 * а також генерує кроки для Process Manager
 * ми створюэмо
 */

class FlowControllerFabrick extends ClassTaskGeneral {
  constructor(props = {}) {
    props.type = "flowControllerFabric";

    super(props);

    this.regs.currentFlow = new ClassReg_number({
      id: "flow",
      value: 0, //%
      min: 0, // value.min
      max: 100, // value.max
      step: 1,
      header: { ua: `Потік`, en: `Flow`, ru: `Поток` },
      unit: "%",
      comment: { ua: ``, en: ``, ru: `` },
    });
    this.regs.duration = new ClassReg_number({
      id: "timer",
      value: 0, //%
      min: 0, // value.min
      max: 24 * 60 - 1, // value.max 23:59 годин
      step: 1,
      header: { ua: `Тривалість`, en: `Duration`, ru: `Длительность` },
      unit: "%",
      comment: {
        ua: `Тривалість подавання газу`,
        en: `Duration of gas flowing`,
        ru: `Длительность подачи газа`,
      },
    });
  } // constructor

  getRegForHTML() {
    return this.getRegForProgramEditor();
  }
  /**
   *
   * @returns {Object}
   */
  getRegForProgramEditor() {
    let trace = 1,
      ln = this.ln + "getRegForHtml()::";
    let reg = clone(this);
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    return reg;
  } // getRegFor ProgramEditor

  /**
   * Отримує налаштування програми
   * @param {Object} regs
   * @param {Number} regs.flow - %, потік 0..100%
   * @param {Number} regs.duration - хв, тривалість
   * @returns {async function}  - асинхронна функція кроку
   */
  getStepForProcessMan(regs) {}
  /**
   * Заглушка, для сумісності з попереднім кодом
   * @param {*} regs
   * @returns
   */
  getStep(regs) {
    this.getStepForProcessMan(regs);
  }
}
