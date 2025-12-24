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

/**
 * @typedef {Object} ifaceSendArgs
 * @property {Number} FC - функція Modbus
 * @property {Number} addr - адреса регістра в приладі
 * @property {Number|Buffer} data - дані для запису в прилад або кількість байт для читання з приладу
 */

/**
 * @typedef {Object} driverAnswerObject
 * @property {Error|null} err - помилка або null
 * @property {Object|null} data - дані або null
 * @property {Number|String} data.value - значення регістру, що запамятовується в менеджері
 * @property {String} data.note - примітки до значення регістру
 * можливі інші поля в data в залежності від реалізації
 */

/**
 * @typedef {Object} ClassDriverRegisterGeneral
 * @property {String|Number} addr - адреса регістра в приладі
 * @property {Object} units - { ua: ``, en: ``, ru: ``} одиниці виміру
 * @property {String} note - примітки до опису регістру (наприлад:"Вхід DI1")
 * @property {function(number=0):{ifaceSendArgs}} _get - читання перед-обробка number = дані що передаються функції Modbus
 * @property {function(Buffer):{driverAnswerObject}} get_ - читання пост-обробка Buffer = чисті дані що отримані по rs485
 * функція інтерпретує їх в зрозумілу для драйвера форму (наприклад приходить т-ре в форматі BCD:[0x1,0x0,0x1,0x5", а драйвер повертає число 1015)
 * @property {function(number=0):{ifaceSendArgs}} _set - запис перед-обробка number = дані що передаються функції Modbus
 * @property {function(Buffer):{driverAnswerObject}} set_ - читання пост-обробка Buffer = чисті що отримані по rs485
 * функція інтерпретує їх в зрозумілу для драйвера форму (наприклад приходить час в форматі HH:MM =[0x1,0x0,0x1,0x5", а драйвер повертає число хвилин 10*60+15)
 */

module.exports = class ClassDriverRegisterGeneral extends ClassGeneral {
  /**
   *
   * @param {ClassDriverRegisterGeneral} props
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
