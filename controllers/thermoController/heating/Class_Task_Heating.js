const Class_Task_Thermo = require("../../tasksController/Class_Task_Thermo");

class Class_Task_Heating extends Class_Task_Thermo {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */
  constructor(props = {}) {
    super(props);
    this.type = "quickHeating";
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
  }
} //class ClassThermoStep
