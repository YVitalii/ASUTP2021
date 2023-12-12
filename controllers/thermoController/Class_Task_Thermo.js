const Class_Task_Thermo = require("../tasksController/Class_Task_general.js");

class Class_Task_Heating extends Class_Task_Thermo {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    super(props);
    // задана температура
    this.regs.tT = {
      id: "tT",
      type: "number",
      value: props.tT.value ? props.tT.value : undefined,
      header: { ua: "T,°C", en: "T,°C", ru: "T,°C" },
      title: {
        ua: `Цільова температура, °С`,
        en: `Task temperature, °С`,
        ru: `Целевая температура, °С`,
      },
      min: undefined,
      max: undefined,
    };
    // мінімальне відхилення температури від розрахункової
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
      header: { ua: "Позційний", en: "Positional", ru: "Позиционный" },
      type: "number",
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
      value: props.errTmax.value ? props.errTmax.value : +25,
      title: {
        ua: `Максимальне перевищення температури,°С`,
        en: `Limit of high temperature,°С`,
        ru: `Максимальное превышение температуры,°С`,
      },
      min: 2,
      max: +20,
    };

    this.regs.regMode = {
      id: "regMode",
      header: { ua: "Регулювання", en: "Regulation", ru: "Регулирование" },
      type: "select",
      value: [
        {
          id: "pid_ti",
          header: { ua: "tI", en: "tI", ru: "tI" },
          type: "number",
          value: props.pid_ti ? props.pid_ti : 0,
          title: {
            ua: `Інтегральна складова`,
            en: `the Integral gain`,
            ru: `Интегральная составляющая`,
          },
          min: 0,
          max: +1000,
        },
      ], // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      title: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    };
  }
} //class ClassThermoStep

module.exports = Class_Task_Thermo;
