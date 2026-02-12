/**
 * @typedef {Object} DeviceEmulatorRegister
 * @property {number} addr - Адреса регістра.
 * @property {number} readOnly=false - тільки для читання.
 * @property {number} _value=0 - Поточне значення регістра.
 * @property {function} value.get() - Метод для отримання поточного значення регістра.
 * @property {function} value.set(value) - Метод для встановлення нового значення регістра.
 */

class DeviceEmulatorRegister {
  constructor(parent, props = {}) {
    this.parent = parent;
    if (props.addr === undefined) {
      throw new Error("property 'addr' must be defined ");
    }
    this.addr = props.addr;

    if (!props.get && typeof props.get != "function") {
      props.get = () => {
        console.log("this=");
        console.dir(this);
      };
    }
  }
}

module.exports = DeviceEmulatorRegister;
