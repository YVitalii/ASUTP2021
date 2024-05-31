const clone = require("clone");

module.exports = class ClassDeviceRegGeneral {
  /**
   *
   * @param {Object} props
   * @param {String} props.id - id регістру в драйвері
   * @param {Object} props.header - {ua:,en:,..} - Короткий опис регістру
   * @param {Object} props.comment  - {ua:,en:,..} - Розширений  опис регістру
   * @param {String} props.units - одиниці виміру
   * @param {} props.type="text" - тип значення регістру для побудови HTML
   * @param {} props.obsolescence=30, сек, період за який дані застаріють
   * @param {} props.
   */
  constructor(props) {
    // id регістру в драйвері
    if (!props.id) {
      throw new Error(ln + `"id" for the device must be defined!`);
    }
    this.id = props.id;

    // назва регістру для відображення в заголовку
    this.header =
      props.header && props.header.en
        ? props.header
        : { ua: `${this.id}`, en: `${this.id}`, ru: `${this.id}` };

    // додатковий опис регістру
    this.comment =
      props.comment && props.comment.en
        ? props.comment
        : { ua: ``, en: ``, ru: `` };
    // одиниці виміру
    this.units =
      props.units && props.units.en ? props.units : { ua: ``, en: ``, ru: `` };
    // тип значення регістру для побудови HTML
    this.type = props.type ? props.type : "text";
    // для регістрів з типами number
    if (this.type == "number" || this.type == "timer") {
      this.min = props.min;
      this.max = props.max;
    }
    // період за який дані застаріють
    let p = parseInt(props.obsolescence);
    this.obsolescence = isNaN(p) ? 30 : p;

    // тільки для читання
    this.readonly = props.readonly;

    // поточне значення
    this._value = undefined;
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
