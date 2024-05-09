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
      step: 0.1,
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
      step: 0.01,
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
      step: 0.01,
    });
  }
};
