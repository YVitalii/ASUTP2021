const ClassReg_regsList = require("../regsController/ClassReg_regsList");
const ClassReg_number = require("../regsController/ClassReg_number");

module.exports = class ClassControllerPID extends ClassReg_regsList {
  constructor(props = {}) {
    props.id = props.id ? props.id : "pid";
    props.header = { ua: "ПІД", en: "PID", ru: "ПИД" };
    props.comment = {
      ua: `ПІД закон регулювання`,
      en: `PID regulation`,
      ru: `ПИД закон регулл.`,
    };
    super(props);
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

    this.regs.o = new ClassReg_number({
      id: "o",
      header: {
        ua: "П",
        en: "P",
        ru: "П",
      },
      value: props.o ? props.o : 5,
      comment: {
        ua: "Пропорційна складова",
        en: "Proportional gain",
        ru: "Пропорциональная составляющая",
      },
      min: 0,
      max: 100,
    });
    this.regs.ti = new ClassReg_number({
      id: "ti",
      header: {
        ua: "І",
        en: "I",
        ru: "И",
      },
      value: props.ti ? props.ti : 5,
      comment: {
        ua: "Інтегральна складова",
        en: "Integral gain",
        ru: "Интегральная составляющая",
      },
      min: 0,
      max: 100,
    });
    this.regs.td = new ClassReg_number({
      id: "td",
      header: {
        ua: "Д",
        en: "D",
        ru: "Д",
      },
      value: props.td ? props.td : 5,
      comment: {
        ua: "Диференційна складова",
        en: "Differencial gain",
        ru: "Диферинциальная составляющая",
      },
      min: 0,
      max: 100,
    });
  }
};
