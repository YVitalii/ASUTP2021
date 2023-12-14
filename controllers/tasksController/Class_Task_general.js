class ClassTask {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    // Тут мають зберігатися регістри класу
    this.regs = {};
    this.type = {
      id: "undefined",
      title: { ua: `undefined`, en: `undefined`, ru: `undefined` },
    };
    if (props.type) {
      this.type.id = props.type.id ? props.type.id : this.type.id;
      this.type.title = props.type.title ? props.type.title : this.type.title;
    }
  }
} //class ClassThermoStep

module.exports = ClassTask;
