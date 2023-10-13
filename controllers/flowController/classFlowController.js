/**
 Class 
constructor (props)
this.stabilization=false - індикатор перехідного процесу (щоб не було помилки періодичн. перевірки під час зміни цільової витрати)
this.defaultTestValuesList=[0,25,50,75,100]  // список точок для перевірки стартової витрати
this.getFlow() - повертає поточну витрату газу в м3/год 
*/

/**
 * Класс FlowController, що керує роботою регулятора потоку
 */

const log = require("../../tools/log.js");
const pug = require("pug");
// немає сенсу бо в 1 контролері може бути багато адрес @param {Number}  props.addr = адреса в мережі RS485

log("i", "--------------------------");
class FlowControler {
  /**
   * @param {Object}  props - об'єкт з налаштуваннями
   * @param {Object}  props.regErr = {min:..; max:..}, [%]- помилка регулювання
   *
   * @param {Number}  props.id = ідентифікатор контролера, по цьому імені його можна знайти
   * @param {String}  props.shortName = коротка назва "АмВ"
   * @param {String}  props.fullName =  назва контролера, наприклад "Аміак. Великий"
   * @param {Object}  props.flowScale = {min,max} [м3/год] - градуювання регулятора витрати для розрахунку поточної витрати в м3/год
   * @param {Object}  props.getValue() = async функція драйвера приладу , яка має повертати поточну витрату fullfilled (прочитана витрата 0..100%) або reject якщо прочитати неможна
   * @param {Object}  props.setValue() = async функція драйвера приладу , яка має записувати поточну витрату в прилад та повертати fulfilled(витрата 0..100%) або reject якщо записати не можна
   * @param {Object}  props.periodSets ={working=..,waiting=..} [сек]  = час періодичного опитування стану контролера та час очікування стабілізації витрати
   * @param {Number}  props.errCounter = допустима кількість помилок, після якої вмикається аварія
   * */

  constructor(props = null) {
    /** @private {String} ln - загальний підпис для логування */
    this.ln = `FlowControler(${props.id ? props.id : "null"})::`;
    let ln = this.ln + "constructor()::";

    // ---------------- this.id --------------------------------

    if (!props.id) {
      throw new Error(ln + "Must be the id for component!!");
      return;
    }
    this.id = props.id;

    // --------- this.regErr ------------------
    this.regErr = {};
    props.regErr = props.regErr ? props.regErr : {};
    this.regErr.min = props.regErr.min ? props.regErr.min : -5;
    this.regErr.max = props.regErr.max ? props.regErr.max : +5;

    // ----------------this.shortName
    this.shortName = props.shortName ? props.shortName : "null";

    // ----------------this.fullName
    this.fullName = props.fullName ? props.fullName : "null";

    // ----------------this.errCounter - лічильник помилок
    // значення для ініціалізації лічильника
    this.initErrCounter = parseInt(props.errCounter ? props.errCounter : 10);
    // поточний лічильник помилок
    this.errCounter = this.initErrCounter;

    // --------- this.flowScale ------------------
    this.flowScale = {};
    props.flowScale ? props.flowScale : {};
    this.flowScale.min = props.flowScale.min ? props.flowScale.min : 0;
    this.flowScale.max = props.flowScale.max ? props.flowScale.max : 1;

    // ---------------- this.getValue --------------------------------
    if (!props.getValue || typeof props.getValue !== "function") {
      let err = "Received wrong getValue() function";
      log("e", ln, err);
      throw new Error(err);
    }
    this.getValue = props.getValue;

    // ---------------- this.setValue --------------------------------
    if (!props.setValue || typeof props.setValue !== "function") {
      let err = "Received wrong setValue() function";
      log("e", ln, err);
      throw new Error(err);
    }
    this.setValue = props.setValue;

    // --------- this.periodSets ------------------
    this.periodSets = {};
    props.periodSets = props.periodSets ? props.periodSets : {};

    this.periodSets.working = props.periodSets.working
      ? props.periodSets.working
      : 5;
    this.periodSets.waiting = props.periodSets.waiting
      ? props.periodSets.waiting
      : 30;

    /** @private {Number} - поточна реальна витрата 0..100% */
    this.processValue = 0;

    /** @private {Boolean} - індикатор робота/очікування */
    this.run = false;

    /** @private {Number} - поточний період опитування  */
    this.askPeriod = this.periodSets.waiting; // поточний період опитування стану РВ

    /** @private {Number} - поточне задане значення  */
    this.setPoint = 0; //

    /** @private {Number} - поточний стан регулятора потоку  */
    this.state = { note: { en: "Waiting.", ua: "Очікування" }, code: 0 }; //

    // ---------- Запускаємо поточний контроль потоку --------------------
    setTimeout(async () => {
      await this.checkCurrentValue();
    }, 3000);
  } //constructor

  /**
   * перевірка на входження поточного значення в робочий діапазон
   * @param {Number} val  - значення, що перевіряється
   * @returns true - якщо все Ок, або помилка
   */
  checkRange(val) {
    let trace = 0,
      ln = this.ln + `checkRange(${val})::`;
    let min = this.setPoint + this.regErr.min,
      max = this.setPoint + this.regErr.max;
    let msg = `[val=${val.toFixed(1)}; min=${min}; max=${max}]`;
    let note = {};
    let code = 0;
    trace
      ? log(
          "i",
          ln,
          ` min=`,
          min,
          `; max=`,
          max,
          `; this.setPoint=`,
          this.setPoint,
          "; this.errCounter=",
          this.errCounter
        )
      : null;
    if (val < min) {
      note = {
        en: `Current flow [${msg}] is lower then minimum! `,
        ua: `Поточна витрата [${msg}] менше ніж допустимий мінімум!`,
        ru: `Текущий расход [${msg}] ниже минимального`,
      };
      code = -1;
    }
    if (val > max) {
      note = {
        en: `Current flow [${msg}] is greater then maximum! `,
        ua: `Поточна витрата [${msg}] більше ніж допустимий максимум!`,
        ru: `Текущий расход [${msg}] выше максимального!`,
      };
      code = -2;
    }
    if (code < 0) {
      if (this.errCounter <= 0) {
        this.state.code = code;
        this.state.note = note;
        let msg = ln + "Error:" + note.en;
        log("e", msg);
        throw new Error(msg);
        return;
      }
      this.errCounter -= 1;
      return;
    }
    if (this.errCounter < this.initErrCounter) {
      this.errCounter += 1;
    }
    trace ? log("i", ln, `Ok`) : null;
    return true;
  }

  /**
   * Періодична перевірка поточного значення потоку. Запускається кожні this.askPeriod сек
   */
  async checkCurrentValue() {
    let trace = 1,
      ln =
        this.ln +
        "checkCurrentValue(" +
        new Date().toLocaleTimeString() +
        ")::";
    let logLevel = trace ? "info" : "";
    trace ? log(ln, `Started`) : null;
    try {
      // читаємо поточне значення
      let newVal = await this.getValue();
      trace ? log(ln, `newVal=`, newVal.toFixed(2)) : null;
      // застосовуємо фільтр: Running Average (середнє що біжить) https://alexgyver.ru/lessons/filters/
      let dV = newVal - this.processValue;
      let k = Math.abs(dV) > 5 ? 0.9 : 0.1;
      trace ? log(ln, `k=`, k) : null;
      this.processValue += dV * k;
      trace
        ? log(logLevel, ln, `this.processValue=`, this.processValue.toFixed(2))
        : null;
      this.checkRange(this.processValue);
    } catch (error) {
      if (trace) {
        if (trace) {
          log("i", ln, `error=`);
          console.dir(error);
        }
        throw error;
      }
    }

    // плануємо наступну перевірку
    setTimeout(async () => {
      await this.checkCurrentValue();
    }, this.askPeriod * 1000);
  } // checkCurrentValue

  /**
   * @param {any} val
   */
  async setTarget(val) {
    let trace = 1,
      ln = this.ln + `setTarget(${val})::`;
    if (val < 0 || val > 100 || parseInt(val) === NaN) {
      let note = { en: "Erro: Value is out of range" };
      throw new Error(note.en);
      return;
    }
    this.setPoint = parseInt(val);
    try {
      await this.setValue(val);
      log("i", ln, "Completed !!");
      // скидаємо лічильник помилок, щоб не було помилкових спрацювань
      this.errCounter = this.initErrCounter;
    } catch (error) {
      throw error;
    }
  }

  async getTarget() {
    return this.setPoint;
  }

  getCurrentFlow() {
    let trace = 1,
      ln = this.ln + "getCurrentFlow()::";
    trace
      ? log(
          "i",
          ln,
          `this.flowScale.min=${this.flowScale.min}; this.flowScale.max=${this.flowScale.max}; this.processValue = ${this.processValue}`
        )
      : null;
    let val =
      this.flowScale.min +
      ((this.flowScale.max - this.flowScale.min) * this.processValue) / 100;
    trace ? log("i", ln, `val=`, val) : null;
    return val;
  }

  getCurrentValue() {
    return this.processValue;
  }

  getHtml() {
    let res = pug.renderFile("./view/flowControler.pug", this);
    log("i", "--------------------------");
    log("i", res);
    log("i", "--------------------------");
    return res;
  }
}

module.exports = FlowControler;
