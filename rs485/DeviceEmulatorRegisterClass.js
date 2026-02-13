/**
 * @typedef {Object} DeviceEmulatorRegister
 * @property {Object} parent  - посилання на об'єкт приладу (this)
 * @property {number} addr - Адреса регістра.
 * @property {number} value - Поточне значення регістра.
 * @property {String} id  - ідентифікатор регістра
 * @property {String} note - примітка-опис регістра
 */

class DeviceEmulatorRegister {
  /**
   * Конструктор
   * @param {Object} parent  - посилання на об'єкт приладу (this)
   * @param {Object} props - параметри
   * @param {Number} props.addr - адреса регістру
   * @param {Number} props.value - стартове значення регістру
   * @param {String} props.id="r"+props.addr - ідентифікатор регістру (для людини)
   * @param {String} props.note - короткий опис регістру (для людини)
   * @param {Function} props.getR = function() {return this._value} - функція що повинна повертати поточне значення регістра
   * @param {Function} props.setR(val) = function(val) {return ._value} or throw Error - функція що повинна встановлювати поточне значення регістра,
   *                                при неприйнятному значенні повинна викидати помилку
   */
  constructor(parent, props = {}) {
    this.parent = parent;
    if (props.addr === undefined) {
      throw new Error("property 'addr' must be defined ");
    }
    this.addr = props.addr;

    this._value = props.value || props.value == 0 ? props.value : null;

    this.id = props.id && props.id != "" ? props.id : "r" + props.addr;
    this.note = props.note
      ? props.note
      : `Register ${props.addr}(0x${("000" + this.addr.toString(16)).slice(-4)})`;

    if (!props.getR || typeof props.getR != "function") {
      props.getR = () => {
        // console.log("this=");
        // console.dir(this);
        return this._value;
      };
    }
    this.get = props.getR;

    if (!props.setR || typeof props.setR != "function") {
      props.setR = (val) => {
        // console.log("this=");
        // console.dir(this);
        this._value = val;
        return this._value;
      };
    }
    this.set = props.setR;
  } // constructor

  get value() {
    return this.get();
  }
  set value(val) {
    return this.set(val);
  }
}

module.exports = DeviceEmulatorRegister;
