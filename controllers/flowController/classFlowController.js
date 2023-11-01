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
var express = require("express");

// немає сенсу бо в 1 контролері може бути багато адрес @param {Number}  props.addr = адреса в мережі RS485

log("i", "--------------------------");
class FlowControler {
  /**
   * @param {Object}  props - об'єкт з налаштуваннями
   * @param {Object}  props.regErr = {min:-5; max:+5}, [%]- помилка регулювання
   * @param {Number}  props.id = ідентифікатор контролера, по цьому імені його можна знайти
   * @param {String}  props.shortName = {ua,en,ru} коротка назва "АмВ"
   * @param {String}  props.fullName =  {ua,en,ru} назва контролера, наприклад "Аміак. Великий"
   * @param {Object}  props.flowScale = {min=0,max=1} [м3/год] - градуювання регулятора витрати для розрахунку поточної витрати в м3/год
   * @param {Object}  props.getDevicePV() = async функція драйвера приладу , яка має повертати поточну витрату fullfilled (прочитана витрата 0..100%) або reject якщо прочитати неможна
   * @param {Object}  props.setDeviceSP() = async функція драйвера приладу , яка має записувати поточну витрату в прилад та повертати fulfilled(витрата 0..100%) або reject якщо записати не можна
   * @param {Object}  props.periodSets - {working=5,waiting=30 } [сек]  = час періодичного опитування стану контролера та час очікування стабілізації витрати
   * @param {Number}  props.errCounter=10 - допустима кількість помилок, після якої генерується аварія
   * */
  constructor(props = null) {
    log("i", `=====> props=`);
    console.dir(props);

    /** @private {String} ln - загальний підпис для логування */
    this.ln = `FlowControler(${props.id ? props.id : "null"})::`;
    let ln = this.ln + "constructor()::",
      trace = 1;

    // ---------------- this.id --------------------------------

    if (!props.id) {
      throw new Error(ln + "Must be the id for component!!");
      return;
    }
    this.id = props.id;

    this.dirname = __dirname;
    // ------------ router ---------
    this.router = express.Router();
    this.router.post("/getAllRegs", (req, res, next) => {
      let trace = 1,
        ln = this.ln + "router().post(/getAllRegs)";
    });

    // --------- this.regErr ------------------
    this.regErr = {};
    props.regErr = props.regErr ? props.regErr : {};
    this.regErr.min = props.regErr.min ? props.regErr.min : -5;
    this.regErr.max = props.regErr.max ? props.regErr.max : +5;

    // ----------------this.shortName
    this.shortName = props.shortName
      ? props.shortName
      : { ua: "null", en: "null", ru: "null" };

    // ----------------this.fullName
    this.fullName = props.fullName
      ? props.fullName
      : { ua: "null", en: "null", ru: "null" };

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

    // ---------------- this.getDevicePV --------------------------------
    if (!props.getDevicePV || typeof props.getDevicePV !== "function") {
      let err = "Received wrong getDevicePV function";
      log("e", ln, err);
      throw new Error(err);
    }
    this.getDevicePV = props.getDevicePV;

    // ---------------- this.setDeviceSP --------------------------------
    if (!props.setDeviceSP || typeof props.setDeviceSP !== "function") {
      let err = "Received wrong setDeviceSP() function";
      log("e", ln, err);
      throw new Error(err);
    }
    this.setDeviceSP = props.setDeviceSP;

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
    this.PV = 0;

    /** @private {Boolean} - індикатор робота/очікування */
    this.run = false;

    /** @private {Number} - поточний період опитування  */
    this.askPeriod = this.periodSets.waiting; // поточний період опитування стану РВ

    /** @private {Number} - поточне задане значення  */
    this.SP = 0; //

    /** @private {Object} - поточний стан регулятора потоку  */
    this.state = {
      locked: false, // заблокувати ручне керування
      run: false,
      note: { en: "Waiting.", ua: "Очікування", ru: "Ожидание", code: 0 },
      code: 0,
    }; //
    // ---------- Зупиняємо подачу газу, так як контролер продовжує памятати попередні установки --
    this.stop();
    // ---------- Запускаємо поточний контроль потоку --------------------
    setTimeout(async () => {
      await this.checkPV();
    }, 3000);
  } //constructor

  async stop(cb) {
    try {
      // посилаємо команду вимкнути подачу
      await this.setSP(0);
      this.state.run = false;
      this.state.note = {
        en: "Waiting.",
        ua: "Очікування",
        ru: "Ожидание",
        code: 0,
      };
      this.askPeriod = this.periodSets.waiting;
      //this.state.locked=false;
    } catch (error) {
      // якщо помилка, плануємо повторну команду через 3 сек
      setTimeout(() => {
        this.stop();
      }, 3000);
      return;
    }
    return 1;
  }

  /**
   * перевірка на входження поточного значення в робочий діапазон
   * @param {Number} val  - значення, що перевіряється
   * @returns true - якщо все Ок, або помилка
   */
  checkRange(val) {
    let trace = 0,
      ln = this.ln + `checkRange(${val})::`;
    let min = this.SP + this.regErr.min,
      max = this.SP + this.regErr.max;
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
          `; this.SP=`,
          this.SP,
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
  async checkPV() {
    let trace = 0,
      ln = this.ln + "checkPV(" + new Date().toLocaleTimeString() + ")::";
    let logLevel = trace ? "info" : "";
    trace ? log(ln, `Started`) : null;
    try {
      // читаємо поточне значення
      let newVal = await this.getDevicePV();
      trace ? log(ln, `newVal=`, newVal.toFixed(2)) : null;
      // застосовуємо фільтр:
      // Running Average (середнє що біжить) https://alexgyver.ru/lessons/filters/
      let dV = newVal - this.PV;
      let k = Math.abs(dV) > 2 ? 0.9 : 0.1;
      trace ? log(ln, `k=`, k) : null;
      this.PV += dV * k;
      trace ? log(logLevel, ln, `this.PV=`, this.PV.toFixed(2)) : null;
      // перевіряємо на відповіжність діапазону
      this.checkRange(this.PV);
    } catch (error) {
      // якщо в процессі роботи виникла помилка
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
      await this.checkPV();
    }, this.askPeriod * 1000);
  } // checkPV

  /**
   * Встановлення завдання setPoint
   * @param {Number} val
   */
  async setSP(val) {
    let trace = 0,
      ln = this.ln + `setSP(${val})::`;
    trace ? log("i", ln, `Started`) : null;
    if (val < 0 || val > 100 || parseInt(val) === NaN) {
      let note = { en: "Erro: Value is out of range" };
      throw new Error(note.en);
      return;
    }
    this.SP = parseInt(val);
    try {
      await this.setDeviceSP(val);
      log("i", ln, "Completed !!");
      // скидаємо лічильник помилок, щоб не було помилкових спрацювань
      this.errCounter = this.initErrCounter;
    } catch (error) {
      throw error;
    }
  }

  getSP() {
    return this.SP;
  }

  getCurrentFlow() {
    let trace = 0,
      ln = this.ln + "getCurrentFlow()::";
    trace
      ? log(
          "i",
          ln,
          `this.flowScale.min=${this.flowScale.min}; this.flowScale.max=${this.flowScale.max}; this.PV = ${this.PV}`
        )
      : null;
    let val =
      this.flowScale.min +
      ((this.flowScale.max - this.flowScale.min) * this.PV) / 100;
    trace ? log("i", ln, `val=`, val) : null;
    return val;
  }

  getPV() {
    return this.PV;
  }

  getAllRegs() {
    return {
      SP: this.getSP(),
      PV: this.getPV(),
      flow: this.getCurrentFlow(),
      state: this.state,
    };
  }

  htmlFull() {
    let res = pug.renderFile(__dirname + "/view/full.pug", this);
    // log("i", "--------------------------");
    // log("i", res);
    // log("i", "--------------------------");
    return res;
  }

  htmlCompact() {
    let res = pug.renderFile(__dirname + "/view/compact.pug", this);
    // log("i", "--------------------------");
    // log("i", res);
    // log("i", "--------------------------");
    return res;
  }
}

module.exports = FlowControler;

if (!module._parent) {
  //let c = new FlowControler();
}
