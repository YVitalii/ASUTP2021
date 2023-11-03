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
   * @param {Object}  props.regErr = {min:-5; max:+5}, [%]- помилка регулювання
   * @param {Number}  props.id = ідентифікатор контролера, по цьому імені його можна знайти
   * @param {String}  props.shortName = {ua,en,ru} коротка назва "АмВ"
   * @param {String}  props.fullName =  {ua,en,ru} назва контролера, наприклад "Аміак. Великий"
   * @param {Object}  props.flowScale = {min=0,max=1} [м3/год] - градуювання регулятора витрати для розрахунку поточної витрати в м3/год
   * @param {Object}  props.getDevicePV() = async функція драйвера приладу , яка має повертати поточну витрату fullfilled (прочитана витрата 0..100%) або reject якщо прочитати неможна
   * @param {Object}  props.setDeviceSP() = async функція драйвера приладу , яка має записувати поточну витрату в прилад та повертати fulfilled(витрата 0..100%) або reject якщо записати не можна
   * @param {Object}  props.periodSets - {working=1, waiting=1,transition=1, transitionDelay=20 } [сек]  = час періодичного опитування стану контролера та час очікування стабілізації витрати
   * @param {Number}  props.errCounter=10 - допустима кількість помилок, після якої генерується аварія
   * @param {Array of Point}  props.calibrationTable - калібрувальна таблиця витратомірів, Point={x:%,y:m3/h}
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
    this.router = require("./flowControllerRouter.js");

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

    // --------- this.calibrationTable --------------------------------

    this.calibrationTable = props.calibrationTable
      ? props.calibrationTable
      : null;

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

    // ------------ states ---------------------
    props.periodSets = props.periodSets ? props.periodSets : {};
    this.states = {};
    this.states.waiting = {
      note: { en: "Waiting.", ua: "Очікування", ru: "Ожидание" },
      code: 0,
      askPeriod: props.periodSets.waiting ? props.periodSets.waiting : 30, // період між опитуванням в режимі: Очікування
    };

    this.states.transition = {
      note: { en: "Transition", ua: "Перехід", ru: "Переход" },
      code: 1,
      askPeriod: props.periodSets.transition ? props.periodSets.transition : 1, // період опитування в режимі: Зміна завдання
      transitionDelay: props.periodSets.transitionDelay
        ? props.periodSets.transitionDelay
        : 20, // тривалість перехідного процесу
    };

    this.states.working = {
      note: { en: "Working", ua: "Робота", ru: "Работа" },
      code: 2,
      askPeriod: props.periodSets.working ? props.periodSets.working : 5, // період між опитуванням в режимі: робота
    };

    /**  askPeriodTimer - запамятовує поточний таймер, для можливості його скасування при зміні режиму роботи */
    this.askPeriodTimer = null;

    /** @private {Number} - поточна реальна витрата 0..100% */
    this.PV = 0;

    /** @private {Boolean} - індикатор робота/очікування */
    this.run = false;

    /** @private {Number} - поточне задане значення  */
    this.SP = 0; //

    /** блокування ручного керування (якщо йде автоматичне регулювання)  */
    this.locked = false;

    /** @private {Object} - поточний стан регулятора потоку  */
    this.state = this.states.working; //

    // ---------- Зупиняємо подачу газу, так як контролер продовжує памятати попередні установки --
    this.stop();

    // ---------- Запускаємо поточний контроль потоку --------------------
    this.askPeriodTimer = setTimeout(async () => {
      await this.checkPV();
    }, this.state.askPeriod * 1000);
  } //constructor

  async stop(cb) {
    let trace = 1,
      ln = this.ln + "stop()::";
    log("i", ln, "Received");
    try {
      // посилаємо команду вимкнути подачу
      await this.setSP(0);
      //this.state = this.states.waiting;
    } catch (error) {
      // якщо помилка, плануємо повторну команду через 3 сек
      log("e", "Помилка зупинки приладу");
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
   * Періодична перевірка поточного значення потоку. Запускається кожні this.state.askPeriod сек
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
      if (this.state.code != 1) {
        // не перехідний процес: перевіряємо на відповіжність діапазону
        this.checkRange(this.PV);
      } else {
        let delay = (new Date().getTime() - this.transitionStart) / 1000;
        trace ? log("i", ln, `Transition delay=`, delay, " sek") : null;
        if (delay > this.state.transitionDelay) {
          trace ? log("w", ln, `Transition finished!`) : null;
          if (this.SP == 0) {
            this.state = this.states.waiting;
          } else {
            this.state = this.states.working;
          }
        }
      }
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
    this.askPeriodTimer = setTimeout(async () => {
      await this.checkPV();
    }, this.state.askPeriod * 1000);
  } // checkPV

  /**
   * Встановлення завдання setPoint
   * @param {Number} val
   */
  async setSP(val) {
    let trace = 1,
      ln = this.ln + `setSP(${val})::`;
    trace ? log("i", ln, `Started`) : null;
    val = parseInt(val);
    if (val < 0 || val > 100 || parseInt(val) === NaN) {
      let note = { en: "Erro: Value is out of range" };
      throw new Error(note.en);
      return;
    }
    this.SP = val;
    try {
      // if (trace) {
      //   log("i", ln, `this.setDeviceSP=`);
      //   console.dir(this.setDeviceSP);
      // }

      // посилаємо запит в прилад
      await this.setDeviceSP(val);
      // вмикаємо перехідний режим
      if (this.askPeriodTimer) {
        clearTimeout(this.askPeriodTimer);
      }
      this.state = this.states.transition;
      this.transitionStart = new Date().getTime();
      this.checkPV();
      // скидаємо лічильник помилок, щоб не було помилкових спрацювань
      this.errCounter = this.initErrCounter;
      log("i", ln, "Completed !!");
    } catch (error) {
      throw error;
    }
    return this.SP;
  }

  getSP() {
    return this.SP;
  }

  getCurrentFlow() {
    let trace = 1,
      ln = this.ln + "getCurrentFlow()::";
    trace ? log("i", ln, `Started`) : null;
    let val = 0;
    if (!this.calibrationTable) {
      trace
        ? log(
            "i",
            ln,
            `this.flowScale.min=${this.flowScale.min}; max=${this.flowScale.max}; this.PV = ${this.PV}`
          )
        : null;
      val =
        this.flowScale.min +
        ((this.flowScale.max - this.flowScale.min) * this.PV) / 100;
      trace ? log("i", ln, `val=`, val) : null;
      return val;
    }
    let table = this.calibrationTable;
    // if (trace) {
    //   log("i", ln, `this.calibrationTable=`);
    //   console.dir(this.calibrationTable);
    // }
    for (let i = 1; i < table.length; i++) {
      trace ? log("i", ln, `table[${i}]=`, table[i]) : null;
      if (this.PV <= table[i].x) {
        let x1 = table[i - 1].x,
          y1 = table[i - 1].y;
        let x2 = table[i].x,
          y2 = table[i].y;
        trace
          ? log(
              "i",
              ln,
              `by CalibrationTable: x1=${x1}; y1=${y1}; x2=${x2}; y2=${y2}`
            )
          : null;
        let k = (y2 - y1) / (x2 - x1);
        let c = y1 - k * x1;
        val = k * this.PV + c;
        trace
          ? log("i", ln, `by CalibrationTable: k=${k}; c=${c}; val=${val}`)
          : null;
        break;
      }
    }
    return val;
  }

  getPV() {
    return this.PV;
  }

  async setRegs(regs) {
    let trace = 1,
      ln = this.ln + `setRegs(${regs})::`;
    trace ? log("i", ln, `Started`) : null;
    let res = { err: null, data: {} };
    regs = JSON.parse(regs);
    for (const key in regs) {
      if (Object.hasOwnProperty.call(regs, key)) {
        //const value = regs[key];
        switch (key) {
          case "SP":
            res.data[key] = await this.setSP(regs[key]);
            break;
          default:
            log("w", ln, "Undefined register:[" + element + "]");
            break;
        }
      }
    }
  }

  getRegs(list) {
    //list = list.slice(1, -1);
    let obj = { err: null, data: null };
    let trace = 1,
      ln = this.ln + `getRegs(${list})::`;
    trace ? log("i", ln, `Started`) : null;
    list = list.split(";");
    let res = {};
    for (let i = 0; i < list.length; i++) {
      const element = list[i].trim();
      switch (element) {
        case "SP":
          res[element] = this.getSP();
          break;
        case "PV":
          res[element] = this.getPV();
          break;
        case "flow":
          res[element] = this.getCurrentFlow();
          break;
        case "state":
          res[element] = this.state;
          break;
        default:
          log("w", ln, "Undefined register:[" + element + "]");
          break;
      }
    }
    if (trace) {
      log("i", ln, `data=`);
      console.dir(res);
    }
    obj.data = res;
    return obj;
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
