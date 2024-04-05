/**
 * Тип регістру для реєстрації
 * @typedef {Object} loggerRegisters
 * @property {String} id - id регістра, для ідентифікації в таблиці логу та лініях графіку "T1"
 * @property {Object} header={ua,en,ru} - короткий опис регістра для легенди "Зона №1"
 * @property {Object} comment={ua,en,ru} - розгорнутий опис для спливаючої підказки "Поточна температура зони №1"
 * @property {async function} getValue()={} -функція отримання поточного значення регістру
 * @property {String|Number} value=undefined - поточне значення регістра
 * @property {Object} units={ua,en,ru} - одиниці вимірювання
 */
class ClassLoggerRegisters {
  constructor(props) {
    let trace = 1,
      ln = "ClassLoggerRegisters::constructor()::";
    if (!props.id) {
      throw new Error(ln + "'id' must be defined!");
    }
    this.id = props.id;
    if (!props.getValue || typeof props.getValue != "function") {
      throw new Error(
        ln + "'getValue' must be declared and must be a async function!"
      );
    }

    // ---- отримання поточного значення -------
    this.getValue = props.getValue;
    // ---- поточне значення -------
    this.value = props.value ? props.value : null;
    // ---- заголовки -------
    this.header =
      props.header && props.header.ua
        ? props.header
        : { ua: `??`, en: `??`, ru: `??` };
    // ----- примітки ---------
    this.comment =
      props.comment && props.comment.ua
        ? props.comment
        : { ua: ``, en: ``, ru: `` };
    // ----- одиниці виміру ---------
    this.units =
      props.units && props.units.ua ? props.units : { ua: ``, en: ``, ru: `` };
  }
} //class ClassLoggerRegisters

module.exports = ClassLoggerRegisters;
