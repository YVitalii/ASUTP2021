const clone = require("clone");
const ClassGeneral = require("../../ClassGeneral");
const types = new Set(["text", "number", "timer", "boolean"]);

module.exports = class ClassDevManagerRegGeneral extends ClassGeneral {
  /**
   * @constructor
   * @param {Object} props
   * @param {String} props.units - одиниці виміру
   * @param {String} props.type="text" - тип значення регістру (для побудови HTML)
   * @param {Number} props.obsolescence=30, сек, період за який дані застаріють
   * @param {Number} props.min - тільки для type= "number" | "timer"
   * @param {Number} props.max - тільки для type= "number" | "timer"
   * @param {} props.driverRegName - назва регістру в драйвері (наприклад в драйвері:"DI1", а в менеджері "doorOpened")
   */
  constructor(props) {
    super(props);

    // одиниці виміру
    this.units =
      props.units && props.units.en ? props.units : { ua: ``, en: ``, ru: `` };

    // тип значення регістру для побудови в HTML
    this.type = props.type ? props.type : "text";
    if (!types.has(this.type)) {
      throw new Error(`Invalid type of register! this.type=${this.type}`);
    }

    // для регістрів з типами number
    if (this.type == "number" || this.type == "timer") {
      this.min = props.min;
      this.max = props.max;
    }

    // назва регістру в драйвері

    this.driverRegName = props.driverRegName ? props.driverRegName : this.id;

    // період за який дані застаріють
    let p = parseInt(props.obsolescence);
    this.obsolescence = isNaN(p) ? 30 : p;

    // тільки для читання
    this.readonly = props.readonly ? true : false;

    // поточне значення,внутрішнє → з підкресленням бо в нас визначені get & set
    this._value = null;

    // дата останнього оновлення - 10 хв тому
    this.timestamp = new Date().getTime() - 10 * 60 * 1000;
  } // constructor

  get value() {
    return this._value;
  }

  set value(val) {
    if (this.min != undefined) {
      if (val < this.min)
        throw new Error(
          `val =${val} min must be greater than this.min = ${this.min}!`
        );
    }
    if (this.max != undefined) {
      if (val > this.max)
        throw new Error(
          `val =${val} must be lower than this.max = ${this.max}!`
        );
    }
    this._value = val;
    this.timestamp = new Date().getTime();
  }

  /**
   * Перевірка на актуальність поточного значення
   * @returns true - якщо данні ще не застаріли, false - застаріли
   */
  isActual() {
    return this.obsolescence * 1000 > new Date().getTime() - this.timestamp;
  }

  /**
   *
   * @returns копію об'єкта з основними значеннями регістру
   */
  getAll() {
    let res = {
      id: this.id,
      header: this.header,
      comment: this.comment,
      type: this.type,
      value: this._value,
      timestamp: this.timestamp,
      units: this.units,
      obsolescence: this.obsolescence,
      readonly: this.readonly,
      min: this.min,
      max: this.max,
    };
    return clone(res);
  }
};
