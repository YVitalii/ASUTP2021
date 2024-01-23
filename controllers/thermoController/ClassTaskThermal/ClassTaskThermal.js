const ClassTaskGeneral = require("../../tasksController/ClassTaskGeneral.js");
const ClassRegister = require("../../regsController/ClassRegister.js");
const ClassReg_number = require("../../regsController/ClassReg_number.js");
const ClassReg_regsList = require("../../regsController/ClassReg_regsList.js");
const ClassReg_select = require("../../regsController/ClassReg_select.js");
const ClassControllerPID = require("../../controllerPID/ClassControllerPID.js");

class ClassTaskThermal extends ClassTaskGeneral {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    super(props);
    this.id = this.id ? this.id : "TaskThermal";
    this.header = this.header
      ? this.header
      : {
          ua: `Термообробка`,
          en: `Heattreatment`,
          ru: `Термообработка`,
        };
    this.comment = this.comment
      ? this.comment
      : {
          ua: `Термообробка`,
          en: `Heattreatment`,
          ru: `Термообработка`,
        };
    this.ln = `ClassTaskThermal()::`;

    // задана температура
    //props.tT = props.tT ? props.tT : {};

    this.regs.tT = new ClassReg_number({
      id: "tT",
      type: "number",
      value: props.tT ? props.tT : 0,
      header: { ua: "T,°C", en: "T,°C", ru: "T,°C" },
      comment: {
        ua: `Цільова температура`,
        en: `Task temperature`,
        ru: `Целевая температура`,
      },
      min: 0,
      max: 150,
    });

    // максимальне відхилення температури вниз
    //props.errTmin = props.errTmin ? props.errTmin : {};
    this.regs.errTmin = new ClassReg_number({
      id: "errTmin",
      header: { ua: "errTmin,°C", en: "errTmin,°C", ru: "errTmin,°C" },
      value: props.errTmin ? props.errTmin : -0,
      comment: {
        ua: `Макс. відх. вниз (0=вимкн)`,
        en: `Limit of low temperature (0=disable)`,
        ru: `Макс. откл. вниз (0=выкл)`,
      },
      min: -100,
      max: 0,
    });

    // максимальне відхилення температури
    //props.errTmax = props.errTmax ? props.errTmax : {};
    this.regs.errTmax = new ClassReg_number({
      id: "errTmax",
      header: { ua: "errTmax,°C", en: "errTmax,°C", ru: "errTmax,°C" },
      value: props.errTmax ? props.errTmax : +0,
      comment: {
        ua: `Макс. відх. вверх (0=вимкн)`,
        en: `Limit of high temperature (0=disable)`,
        ru: `Макс. откл. вверх (0=выкл)`,
      },
      min: 0,
      max: 100,
    });

    //  закон регулювання "Позиційний"

    let pos = new ClassReg_regsList({
      id: "pos",
      header: { ua: "Позиційний", en: "Positional", ru: "Позиционный" },
      comment: {
        ua: `Позиційний закон регулювання`,
        en: `Positional regulation`,
        ru: `Позиционный закон регуллирования`,
      },
    });

    pos.regs.o = new ClassReg_number({
      id: "o",
      header: { ua: "Неузгодження", en: "Difference", ru: "Рассогласование" },
      value: -2,
      comment: {
        ua: `Неузгодження температур,°С`,
        en: `Temperature difference,°С`,
        ru: `Рассогласование температур,°С`,
      },
      min: -20,
      max: 0,
    });

    let pid = new ClassControllerPID();

    this.regs.regMode = new ClassReg_select({
      id: "regMode",
      header: { ua: "Регулювання", en: "Regulation", ru: "Регулирование" },
      value: "pid",
      regs: { pos, pid }, // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      comment: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    });
  } // constructor
} //class ClassThermoStep

module.exports = ClassTaskThermal;
