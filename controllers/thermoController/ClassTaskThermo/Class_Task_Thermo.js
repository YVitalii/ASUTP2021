const Class_Task_General = require("../../tasksController/Class_Task_general.js");

class Class_Task_Thermo extends Class_Task_General {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    super(props);
    // задана температура
    props.tT = props.tT ? props.tT : {};
    this.regs.tT = {
      id: "tT",
      type: "number",
      value: props.tT.value ? props.tT.value : 100,
      header: { ua: "T,°C", en: "T,°C", ru: "T,°C" },
      title: {
        ua: `Цільова температура, °С`,
        en: `Task temperature, °С`,
        ru: `Целевая температура, °С`,
      },
      min: 0,
      max: 150,
    };
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
      value: {},
      title: {
        ua: `Позиційний закон регулювання`,
        en: `Positional regulation`,
        ru: `Позиционный закон регуллирования`,
      },
    };

    pos.value.o = {
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
      type: "selectItem",
      value: {},
      title: {
        ua: `ПІД закон регулювання`,
        en: `PID regulation`,
        ru: `ПИД закон регуллирования`,
      },
    };

    pid.value.o = {
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
    pid.value.i = {
      id: "i",
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
    pid.value.d = {
      id: "d",
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
      value: [pos, pid], // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      title: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    };
  } // constructor
} //class ClassThermoStep

module.exports = Class_Task_Thermo;
