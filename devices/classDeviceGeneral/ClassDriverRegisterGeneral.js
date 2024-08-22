/** типовий регістр драйвера  */
const ClassGeneral = require("../../ClassGeneral");
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

function testFunction(func) {
  if (typeof func === "function") {
    return func;
  }
  return function (arg) {
    return this.id;
  };
}

module.exports = class ClassDriverRegisterGeneral extends ClassGeneral {
  constructor(props) {
    super(props);

    // -------- addr ----------
    this.addr = test(props.addr, "'addr' of register must be defined!");

    // -------- units ------------
    this.units =
      props.units && props.units.en ? props.units : { ua: ``, en: ``, ru: `` };

    // ----  _get() ----------
    this._get = testFunction(props._get);

    // ----  get_() ----------
    this.get_ = testFunction(props.get_);

    // ----  _set() ----------
    this._set = testFunction(props._set);

    // ----  set_() ----------
    this.set_ = testFunction(props.set_);
  } //constructor
};
