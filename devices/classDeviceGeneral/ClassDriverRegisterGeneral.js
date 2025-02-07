/** типовий регістр драйвера  */
const ClassGeneral = require("../../ClassGeneral");
const log = require("../../tools/log");

/* Заготовка для опису регістру
 
  driver.addRegister({
    id: "",
    addr: 0x0000,
    header: { ua: ``, en: ``, ru: `` },
    units: { ua: ``, en: ``, ru: `` },
    note: ``,
    _get: function (arg) {}, 
    get_: function (arg) {},
    _set: function (arg) {},
    set_: function (arg) {},
    });
*/

/**
 *  Функція перевіряє аргумент на undefined та повертає помилку або argument
 *
 */
function test(item, errMessage = "An error was happened!") {
  if (item === undefined) {
    //console.log(" " + item + " Error");
    throw new Error(errMessage);
  }
  return item;
}
/**
 *
 * @param {*} func
 * @returns func =  if func is a function |  {err:null,data:arg} - if func === undefined
 */
function testFunction(func) {
  if (typeof func === "function") {
    return func;
  }
  log("w", this.ln + `testFunction(${func.name})::func must be a Function`);
  return function (arg = {}) {
    return { err: null, data: arg };
  };
}

module.exports = class ClassDriverRegisterGeneral extends ClassGeneral {
  /**
   *
   * @param {*} props
   * @param {String|Number} props.addr - адреса регістра в приладі
   * @param {Object} props.units - { ua: ``, en: ``, ru: ``} одиниці виміру
   * @param {String} props.note - примітки до опису регістру (наприлад:"Вхід DI1")
   * @param {Function} props._get(arg={}) = {err:null,data:arg} - читання перед-обробка, data - набір даних для iface.send(data)
   * @param {Function} props.get_(arg={}) = {err:null,data:arg} - читання пост-обробка, data - інтерпретація відповіді iface.send(data)
   * @param {Function} props._set(arg={}) = {err:null,data:arg} - запис перед-обробка, data - набір даних для iface.send(data)
   * @param {Function} props.set_(arg={}) = {err:null,data:arg} - запис пост-обробка, data - інтерпретація відповіді iface.send(data)
   */
  constructor(props) {
    super(props);

    // -------- addr ----------
    this.addr = test(props.addr, "'addr' of register must be defined!");

    // -------- units ------------
    this.units =
      props.units && props.units.en ? props.units : { ua: ``, en: ``, ru: `` };

    // -------- note - примітки до опису регістру ------------
    this.note = props.note ? props.note : ``;

    // ----  _get() ----------
    this._get = this.testFunction(props._get);

    // ----  get_() ----------
    this.get_ = this.testFunction(props.get_);

    // ----  _set() ----------
    this._set = this.testFunction(props._set);

    // ----  set_() ----------
    this.set_ = this.testFunction(props.set_);
  } //constructor
  testFunction(func) {
    if (typeof func === "function") {
      return func;
    }
    log("w", this.ln + `testFunction(${func})::func must be a Function`);
    return function (arg = {}) {
      return { err: null, data: arg };
    };
  }
};
