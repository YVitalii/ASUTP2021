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
const dummy = require("../../tools/dummy.js");
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
   * @param {async Function}  props.getDevicePV() = async функція, яка має повертати поточну витрату (прочитана витрата 0..100%) або reject якщо прочитати неможна
   * @param {async Function}  props.setDeviceSP(val) = async функція, яка має записувати поточну витрату в прилад та повертати fulfilled(витрата 0..100%) або reject якщо записати не можна
   * @param {async Function}  props.getDevicePressure() = функція що має повертати тиск газу на вході в %, для реле (0 або 100), для аналогових 0..100%
   * @param {Object}  props.pressureList = {alarm:0,warning:0,normal:100,heigh:120} налаштування рівней тиску газу: Number (по замовчуванню налаштування для дискретного датчика)
   * @param {Object}  props.periodSets - {working=1, waiting=1,transition=1, transitionDelay=20 } [сек]  = час періодичного опитування стану контролера та час очікування стабілізації витрати
   * @param {Number}  props.errCounter=10 - допустима кількість помилок, після якої генерується аварія
   * @param {async Function}  props.alarm(info={}) - функція, що викликається при аварії
   * @param {async Function}  props.warning(info={}) - функція, що викликається при аварії
   * */
  constructor(props = null) {
    /** @private {String} ln - загальний підпис для логування */
    this.ln = `FlowControler(${
      props.shortName && props.shortName.ua ? props.id : "props.shortName.ua"
    })::`;
    let ln = this.ln + "constructor()::",
      trace = 0;

    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }

    // ---------------- this.id --------------------------------

    if (!props.id) {
      throw new Error(ln + "Must be the id for component!!");
      return;
    }
    this.id = props.id;

    // ---------------- this.pressureList --------------------------------
    // опис рівней тисків, для контролю
    props.pressureList = props.pressureList ? props.pressureList : {};
    this.pressureList = {
      alarm: {
        value: props.pressureList.alarm ? props.pressureList.alarm : 0,
        note: {
          code: "alarm",
          ua: `Аварія! Немає газу`,
          en: `Alarm! No gas`,
          ru: `Авария! Нет газа!`,
        },
      },
      warning: {
        value: props.pressureList.warning ? props.pressureList.warning : 50,
        note: {
          code: "warning",
          ua: `Низький`,
          en: `Low`,
          ru: `Низкое`,
        },
      },
      normal: {
        value: props.pressureList.normal ? props.pressureList.normal : 100,
        note: {
          code: "normal",
          ua: `Норма`,
          en: `Ok.`,
          ru: `Норма`,
        },
      },
      high: {
        value: props.pressureList.high ? props.pressureList.high : 120,
        note: {
          code: "high",
          ua: `Високий`,
          en: `High`,
          ru: `Высокое`,
        },
      },
      notdefined: {
        value: undefined,
        note: {
          code: "notdefined",
          ua: `Невідомо`,
          en: `Undefined`,
          ru: `Неизвестно`,
        },
      },
    };

    /** Поточний значення контроль тиску  */
    this.pressure = {
      timestamp: new Date().getTime(),
      value: undefined,
      note: this.pressureList.notdefined,
    };

    // ---------------- this.getDevicePV --------------------------------
    if (
      !props.getDevicePressure ||
      typeof props.getDevicePressure !== "function"
    ) {
      let err =
        "==>  Error!! Received wrong getDevicePressure function!!! Was seted empty dummy-function! ";
      log("e", ln, err);
      //throw new Error(err);
      props.getDevicePressure = async () => {
        await dummy(3000);
        return undefined;
      };
    }
    this.getDevicePressure = props.getDevicePressure;

    // ---- директорія модуля -----------
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
      note: {
        code: "waiting",
        en: "Waiting",
        ua: "Очікування",
        ru: "Ожидание",
      },
      code: 0,
      askPeriod: props.periodSets.waiting ? props.periodSets.waiting : 1, // період між опитуванням в режимі: Очікування
    };

    this.states.transition = {
      note: {
        code: "transition",
        en: "Transition",
        ua: "Зміна",
        ru: "Изменение",
      },
      askPeriod: props.periodSets.transition ? props.periodSets.transition : 1, // період опитування в режимі: Зміна завдання
      transitionDelay: props.periodSets.transitionDelay
        ? props.periodSets.transitionDelay
        : 10, // тривалість перехідного процесу, щоб уникнути помилки  "Вихід за межі дозволеного діапазону"
    };

    this.states.working = {
      note: { code: "working", en: "Working", ua: "Робота", ru: "Работа" },
      askPeriod: props.periodSets.working ? props.periodSets.working : 1, // період між опитуванням в режимі: робота
    };

    this.states.highFlow = {
      note: {
        code: "highFlow",
        en: `High flow! `,
        ua: `Великий потік!`,
        ru: `Большой поток!`,
      },
      askPeriod: props.periodSets.working ? props.periodSets.working : 1, // період між опитуванням в режимі: робота
    };

    this.states.lowFlow = {
      note: {
        code: "lowFlow",
        en: `Low flow! `,
        ua: `Низька витрата!`,
        ru: `Низкий расход!`,
      },
      askPeriod: props.periodSets.working ? props.periodSets.working : 1, // період між опитуванням в режимі: робота
    };

    /** @private {Object} - поточний стан регулятора потоку  */
    this.state = this.states.waiting; //

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

    // ---------- Запускаємо поточний контроль параметрів --------------------
    this.askPeriodTimer = setTimeout(async () => {
      // ---------- Зупиняємо подачу газу, так як контролер продовжує памятати попередні установки --
      this.stop();

      this.checkPV();
      this.checkPressure();
    }, 5000); // 5 сек - щоб встиг відкритися порт
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
      log("e", ln, "Помилка зупинки приладу");
      setTimeout(() => {
        this.stop();
      }, 3000);
      return;
    }
    return 1;
  }

  lockDevice() {
    this.locked = true;
  }

  unlockDevice() {
    this.locked = false;
  }

  async checkPressure() {
    let trace = 0,
      ln =
        this.ln + "checkPressure()::" + new Date().toLocaleTimeString() + "::";
    trace ? log("i", ln, `Started`) : null;

    let pressure;

    try {
      // зчитуємо тиск в системі
      pressure = undefined;
      pressure = await this.getDevicePressure();

      pressure = parseInt(pressure);
      this.pressure.value = pressure;
      this.pressure.timestamp = new Date().toLocaleTimeString();
    } catch (error) {
      log("e", ln, "Помилка зчитування тиску!");
      pressure = undefined;
    }

    trace ? log("i", ln, `Current pressure=`, pressure) : null;

    // плануємо наступну перевірку тиску
    setTimeout(async () => {
      this.checkPressure();
    }, 6000);

    // помилок немає, перевіряємо
    let list = this.pressureList;
    let note = {};
    let val = pressure;
    if (!isFinite(pressure) || isNaN(pressure)) {
      note = list.notdefined.note;
      trace ? log("i", ln, "note=", note.ua) : null;
    } else if (val <= list.alarm.value) {
      note = list.alarm.note;
      trace ? log("i", ln, "note=", note.ua) : null;
    } else if (val <= list.warning.value) {
      note = list.warning.note;
      trace ? log("i", ln, "note=", note.ua) : null;
    } else if (val <= list.normal.value) {
      note = list.normal.note;
      trace ? log("i", ln, "note=", note.ua) : null;
    } else {
      note = list.high.note;
      trace ? log("i", ln, "note=", note.ua) : null;
    }
    this.pressure.note = note;
    trace ? log("i", ln, `note.ua=`, note.ua) : null;
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
      // lowFlow
      code = -1;
    }
    if (val > max) {
      // highFlow
      code = -2;
    }
    // якщо код помилки менше 0 - є помилка
    if (code < 0) {
      // якщо лічильник помилок спрацював
      if (this.errCounter <= 0) {
        // виставляємо стан помилки
        this.state = code == -1 ? this.states.lowFlow : this.states.highFlow;
        //let msg = ln + "Error:" + note.en;
        log("e", ln + msg);
        return false;
      }
      // зменшуємо декрементуємо лічильник помилок
      this.errCounter -= 1;
      // виходимо
      return true;
    }
    // помилки немає, за потреби інкрементуємо лічильник помилок
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
      if (this.state.note.code != "transition") {
        // не перехідний процес: перевіряємо на відповідність діапазону
        let state = this.checkRange(this.PV);
        trace ? log("i", ln, `checkRange(${this.PV})=`, state) : null;
        if (state) {
          if (this.SP == 0) {
            trace ? log("w", ln, `Set state waiting`) : null;
            this.state = this.states.waiting;
          } else {
            this.state = this.states.working;
            trace ? log("w", ln, `Set state working`) : null;
          }
        }
      } else {
        // перехідний процес
        // рахуємо скільки пройшло часу
        trace = 0;
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
    // якщо прилад заблокований повертаємо помилку
    if (this.locked) {
      let msg = this.ln + "Error: Value=" + val + ">";
      let note = {
        en: msg + " device locked",
        ua: msg + " прилад заблокований",
        ru: msg + " Прибор заблокирован",
      };
      throw new Error(note.en);
    }
    // перевіряємо вхідне значення
    val = parseInt(val);
    if (val < 0 || val > 100 || parseInt(val) === NaN) {
      let msg = this.ln + "Error: Value=" + val + ">";
      let note = {
        en: msg + " is out of range",
        ua: msg + "Завдання за межами дозволеного діапазону",
        ru: msg + "За границами разрешенных значений",
      };
      throw new Error(note.en);
      return;
    }

    // встановлюэмо нову цільову точку
    try {
      // if (trace) {
      //   log("i", ln, `this.setDeviceSP=`);
      //   console.dir(this.setDeviceSP);
      // }

      // посилаємо запит в прилад
      await this.setDeviceSP(val);
      // запамятовуємо нове завдання
      this.SP = val;

      // якщо прийшла конанда = 0 - зупиняємо регулятор
      if (val === 0) {
        this.state = this.states.waiting;
      } else {
        this.state = this.states.working;
      }
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
    let trace = 0,
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
            log("w", ln, `(${key})=regs[key]`);
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
    let trace = 0,
      ln = this.ln + `getRegs(${list})::`;
    trace ? log("i", ln, `Started`) : null;
    list = list.split(";");
    let res = { id: this.id };
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
          res[element].locked = this.locked;
          break;
        case "pressure":
          res[element] = this.pressure;
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
    let res = pug.renderFile(__dirname + "/view/full.pug", this);
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
