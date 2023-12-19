const Class_Task_General = require("../../tasksController/Class_Task_general.js");
const ClassRegister = require("../../regsController/ClassRegister.js");
const ClassReg_number = require("../../regsController/ClassReg_number.js");
const ClassReg_select = require("../../regsController/ClassReg_select.js");

class Class_Task_Thermo extends Class_Task_General {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    props.id = props.id ? props.id : "ClassTaskThermo";
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Термообробка`,
          en: `Heat treatment`,
          ru: `Термообработка`,
        };
    props.type = "step";
    super(props);

    // задана температура
    props.tT = props.tT ? props.tT : {};

    this.regs.tT = new ClassReg_number({
      id: "tT",
      type: "number",
      value: props.tT.value ? props.tT.value : 0,
      header: { ua: "T,°C", en: "T,°C", ru: "T,°C" },
      comment: {
        ua: `Цільова температура, °С`,
        en: `Task temperature, °С`,
        ru: `Целевая температура, °С`,
      },
      min: 0,
      max: 150,
    });

    // максимальне відхилення температури вниз від розрахункової
    props.errTmin = props.errTmin ? props.errTmin : {};
    this.regs.errTmin = new ClassReg_number({
      id: "errTmin",
      header: { ua: "min dT,°C", en: "min dT,°C", ru: "min dT,°C" },
      value: props.errTmin.value ? props.errTmin.value : 0,
      comment: {
        ua: `Максимальне відх. темп. вниз,°С (0=вимкнути)`,
        en: `Limit of low temperature,°С, (0=disable)`,
        ru: `Максим. отклонение темп. вниз,°С, (0=выключено)`,
      },
      min: 0,
      max: -100,
    });

    // максимальне відхилення температури від розрахункової
    props.errTmax = props.errTmax ? props.errTmax : {};
    this.regs.errTmax = new ClassReg_number({
      id: "errTmax",
      header: { ua: "max dT,°C", en: "max dT,°C", ru: "max dT,°C" },
      value: props.errTmax.value ? props.errTmax.value : +25,
      comment: {
        ua: `Максимальне перевищення температури,°С, (0=вимкнути)`,
        en: `Limit of high temperature,°С, (0=disable)`,
        ru: `Максимальное превышение температуры,°С, (0=выключено)`,
      },
      min: 0,
      max: +100,
    });

    //  закон регулювання "Позиційний"

    let pos = new ClassReg_select({
      id: "pos",
      header: { ua: "Позиційний", en: "Positional", ru: "Позиционный" },
      value: 0,
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

    let pid = new ClassReg_select({
      id: "pid",
      header: { ua: "ПІД", en: "PID", ru: "ПИД" },
      value: 0,
      comment: {
        ua: `ПІД закон регулювання`,
        en: `PID regulation`,
        ru: `ПИД закон регуллирования`,
      },
    });

    pid.regs.o = new ClassReg_number({
      id: "o",
      header: {
        ua: "П",
        en: "P",
        ru: "П",
      },
      value: 5,
      comment: {
        ua: "Пропорційна складова",
        en: "Proportional gain",
        ru: "Пропорциональная составляющая",
      },
      min: 0,
      max: 100,
    });

    pid.regs.i = new ClassReg_number({
      id: "ti",
      header: {
        ua: "І",
        en: "I",
        ru: "И",
      },
      value: 5,
      comment: {
        ua: "Інтегральна складова",
        en: "Integral gain",
        ru: "Интегральная составляющая",
      },
      min: 0,
      max: 100,
    });

    pid.regs.d = new ClassReg_number({
      id: "td",
      header: {
        ua: "Д",
        en: "D",
        ru: "Д",
      },
      value: 5,
      comment: {
        ua: "Диференційна складова",
        en: "Differencial gain",
        ru: "Диферинциальная составляющая",
      },
      min: 0,
      max: 100,
    });

    this.regs.regMode = new ClassReg_select({
      id: "regMode",
      header: { ua: "Регулювання", en: "Regulation", ru: "Регулирование" },
      value: "pos",
      regs: { pos, pid }, // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      comment: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    });
  } // constructor
} //class ClassThermoStep

module.exports = Class_Task_Thermo;
