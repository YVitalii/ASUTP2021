const ClassTaskThermal = require("../ClassTaskThermal/ClassTaskThermal");
const ClassReg_number = require("../../regsController/ClassReg_number");
const ClassReg_timer = require("../../regsController/ClassReg_timer");

module.exports = class ClassTask_Heating extends ClassTaskThermal {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */
  constructor(props = {}) {
    props.id = "ClassTask_Heating";
    props.header = {
      ua: `Нагрівання`,
      en: `Heating`,
      ru: `Нагревание`,
    };
    super(props);
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Набір температури`,
          en: `Heating`,
          ru: `Разогрев`,
        };
  }
}; //class ClassThermoStep
