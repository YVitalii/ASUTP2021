const Class_Task_General = require("../../tasksController/Class_Task_general.js");
const ClassRegister = require("../../ClassRegister.js");

class Class_Task_Thermo extends Class_Task_General {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    if (!props.type) {
      props.type = {
        id: "thermal",
        title: {
          ua: `Термообробка`,
          en: `Heat treatment`,
          ru: `Термообработка`,
        },
      };
    }

    super(props);

    // задана температура
    props.tT = props.tT ? props.tT : {};

    this.regs.tT = new ClassRegister({
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
    this.regs.tT.min = 0;
    this.regs.tT.max = 150;

    // мінімальне відхилення температури від розрахункової
    props.errTmin = props.errTmin ? props.errTmin : {};
    this.regs.errTmin = {
      id: "errTmin",
      header: { ua: "min dT,°C", en: "min dT,°C", ru: "min dT,°C" },
      type: "number",
      value: props.errTmin.value ? props.errTmin.value : -50,
      title: {
        ua: `Максимальне відхилення температури вниз,°С`,
        en: `Limit of low temperature,°С`,
        ru: `Максимальное отклонение температуры вниз,°С`,
      },
      min: 0,
      max: -100,
    };
    // максимальне відхилення температури від розрахункової
    props.errTmax = props.errTmax ? props.errTmax : {};
    this.regs.errTmax = {
      id: "errTmax",
      header: { ua: "max dT,°C", en: "max dT,°C", ru: "max dT,°C" },
      type: "number",
      value: props.errTmax.value ? props.errTmax.value : +25,
      title: {
        ua: `Максимальне перевищення температури,°С`,
        en: `Limit of high temperature,°С`,
        ru: `Максимальное превышение температуры,°С`,
      },
      min: 0,
      max: +100,
    };

    //  закон регулювання "Позиційний"

    let pos = {
      id: "pos",
      header: { ua: "Позиційний", en: "Positional", ru: "Позиционный" },
      type: "selectItem",
      value: undefined,
      regs: {},
      title: {
        ua: `Позиційний закон регулювання`,
        en: `Positional regulation`,
        ru: `Позиционный закон регуллирования`,
      },
    };

    pos.regs.o = {
      id: "o",
      header: { ua: "Різниця", en: "Position", ru: "Рассогласование" },
      type: "number",
      value: -2,
      title: {
        ua: `Неузгодження температур,°С`,
        en: `Temperature difference,°С`,
        ru: `Рассогласование температур,°С`,
      },
      min: -20,
      max: 0,
    };

    let pid = {
      id: "pid",
      header: { ua: "ПІД", en: "PID", ru: "ПИД" },
      type: "select",
      value: undefined,
      regs: {},
      title: {
        ua: `ПІД закон регулювання`,
        en: `PID regulation`,
        ru: `ПИД закон регуллирования`,
      },
    };

    pid.regs.o = {
      id: "o",
      header: {
        ua: "П",
        en: "P",
        ru: "П",
      },
      type: "number",
      value: 5,
      title: {
        ua: "Пропорційна складова",
        en: "Proportional gain",
        ru: "Пропорциональная составляющая",
      },
      min: 0,
      max: 100,
    };

    pid.regs.i = {
      id: "ti",
      header: {
        ua: "І",
        en: "I",
        ru: "И",
      },
      type: "number",
      value: 5,
      title: {
        ua: "Інтегральна складова",
        en: "Integral gain",
        ru: "Интегральная составляющая",
      },
      min: 0,
      max: 100,
    };
    pid.regs.d = {
      id: "td",
      header: {
        ua: "Д",
        en: "D",
        ru: "Д",
      },
      type: "number",
      value: 5,
      title: {
        ua: "Диференційна складова",
        en: "Differencial gain",
        ru: "Диферинциальная составляющая",
      },
      min: 0,
      max: 100,
    };

    this.regs.regMode = {
      id: "regMode",
      header: { ua: "Регулювання", en: "Regulation", ru: "Регулирование" },
      type: "select",
      value: "pos",
      regs: [pos, pid], // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      title: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    };
  } // constructor
} //class ClassThermoStep

module.exports = Class_Task_Thermo;