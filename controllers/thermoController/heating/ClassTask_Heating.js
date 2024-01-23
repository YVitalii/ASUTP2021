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
    // зона початку ПІД-регулювання
    this.regs.wT = new ClassReg_number({
      id: "wT",
      value: props.wT ? props.wT : 0,
      header: { ua: "wT,°C", en: "wT,°C", ru: "wT,°C" },
      comment: {
        ua: `Початок ПІД рег. (=0 вимкн.)`,
        en: `Start PID regulation (=0 off)`,
        ru: `Начало ПИД рег. (=0-выкл.)`,
      },
      min: -200,
      max: 0,
    }); //this.regs.wT
    // час нагрівання
    this.regs.H = new ClassReg_timer({
      id: "H",
      value: props.H ? props.H : 0,
      header: { ua: "Нагрівання", en: "Heating", ru: "Нагревание" },
      comment: {
        ua: `Час нагрівання (=0 - макс. швидко)`,
        en: `Heating time (=0 quick)`,
        ru: `Время нагревания (=0 макс. быстро)`,
      },
      min: 0,
      max: 24 * 60 - 1, // input time має максимум 23:59, за потреби довше - дублювати кроки
    }); //this.regs.wT
  }
}; //class ClassThermoStep
