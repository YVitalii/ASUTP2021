/**
 * Класс, що керує роботою блоку вводу-виводу WAD-MIO-MAXPro-645
 */
const device = require("./driver.js"); //драйвер приладу
const log = require("../../tools/log.js");
const trySomeTimes = require("../../tools/trySomeTimes.js");
function toPercent(val = 0) {
  val -= 4; //зміщення на 4 мА вниз
  return (100 * val) / 16;
}

function fromPercent(val = 0) {
  return (val / 100) * 16 + 4;
}

class MaxPRO_645 {
  /**
   * @param {Object} iface - об'єкт інтерфейсу RS485 до якого підключено цей прилад
   * @param {Integer} id - адреса приладу в iface
   * @param {Object} props - об'єкт з налаштуваннями
   * */
  constructor(iface = null, id = null, props = null) {
    this.ln = "MaxPro645_Manager(id=" + id + ")::";
    let ln = this.ln + "constructor()::";
    // -------- id  ---------------
    if (!id) {
      let err = ln + "Має бути вказана адреса приладу";
      log("e", err);
      throw new Error(err);
    }
    this.id = id;
    // ----- iface --------------------------------
    if (!iface) {
      let err = ln + "Має бути вказаний інтерфейс для зв`язку з приладом";
      log("e", err);
      throw new Error(err);
    }
    this.iface = iface;
    this.state = {};

    this.state.AI = {
      // аналоговий вхід
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
      source: {}, // регістр, отриманий з драйверу, для дод.інформації
    };
    this.state.AO = {
      // аналоговий вихід
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
      source: {}, // регістр, отриманий з драйверу, для дод.інформації
    };
    this.state.DI = {
      // дискретний вхід
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
      source: {}, // регістр, отриманий з драйверу, для дод.інформації
    };
    this.state.DO = {
      // дискретний вихід
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
      source: {}, // регістр, отриманий з драйверу, для дод.інформації
    };
    this.trySomeTimes = trySomeTimes;
  } //constructor

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними: {tT:50; o:10,..} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   */

  async setParams(params = null) {
    let trace = 1;
    let ln = this.ln + `setParams():: `;
    trace ? console.log(ln, "Started") : null;
    let err = ""; // опис помилки
    let resString = ln; // рядок відповіді

    //якщо параметри не об'єкт повертаємо помилку
    if (typeof params !== "object") {
      let res = ln + "Error: params must be an object.";
      log("e", res);
      throw new Error(res);
      return;
    }

    let start = new Date(); // запамятовуємо момент виклику функції

    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (params.hasOwnProperty(prop)) {
        trace ? log(ln, `params[${prop}]=`, params[prop]) : null;
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        // даємо запит на запис
        try {
          let value = params[prop];
          value = parseInt(value);
          let res = await this.trySomeTimes(device.setRegPromise, {
            iface: this.iface,
            id: this.id,
            regName: prop,
            value: value,
          });
          if (trace) {
            log("i", ln, `res=`);
            console.dir(res);
          }
          // оновлюємо дані в state
          let reg = this.state[prop];
          reg.value = res.value;
          reg.timestamp = res.timestamp;
          resString += `${prop}=${res.value}; `;
          // if (trace) {
          //   console.log(ln, "res=");
          //   console.dir(res);
          // }
          //this.state[prop] = res;
        } catch (error) {
          log("e", ln, error);
          throw error;
          //throw ror(error.message);
        }
      }
    }

    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    log("i", resString);
    // if (trace) {
    //   console.log(ln, "this.state=");
    //   console.dir(this.state);
    // }
  }

  /* ---------------------- AI ---------------------------- */
  /** Отримує значення з аналогового входу */
  async getAI() {
    let trace = 1,
      ln = this.ln + "getAI()::";
    let currTime = new Date().getTime();
    // якщо актуальність даних ще не втратилась, відразу повертаємо дані
    if (currTime - this.state.AI.timestamp <= this.state.AI.period) {
      return this.state.AI.value;
    }
    // запит даних з приладу
    try {
      let reg = await device.getRegPromise({
        iface: this.iface,
        id: this.id,
        regName: "AI",
      });
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = toPercent(reg[0].value);
      trace ? log("i", ln, `val=`, val) : null;
      this.state.AI.source = reg[0];
      this.state.AI.timeStamp = new Date();
      this.state.AI.value = val;

      return val;
    } catch (error) {
      log("e", ln, error);
    }
  } //async getAI()

  async setAI(val = null) {
    let trace = 1,
      ln = this.ln + "setAI()::";
    let res = ln + "Error! AI is only for reading !!!";
    return reject(new Error(res));
  }

  /* ---------------------- AO ---------------------------- */
  /** Отримує значення з аналогового виходу */
  async getAO() {
    let trace = 1,
      ln = this.ln + "getAO()::";
    let currTime = new Date().getTime();

    // запит даних з приладу
    try {
      let reg = await this.getRegdevice.getRegPromise({
        iface: this.iface,
        id: this.id,
        regName: "AO",
      });
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = toPercent(reg[0].value);
      trace ? log("i", ln, `val=`, val) : null;
      this.state.AO.source = reg[0];
      this.state.AO.timeStamp = new Date();
      this.state.AO.value = val;

      return val;
    } catch (error) {
      log("e", ln, error);
      //throw error;
    }
  } //async getAO()
  /**
   *
   * @param {Number} val - значення 0..100%
   * @returns {Promise} Promise resolved when all Ok
   */
  async setAO(val = null) {
    let trace = 1,
      ln = this.ln + "setAO(" + val + ")::";
    if (val === null) {
      let err = ln + "Error: value = null";
      log("e", ln);
      throw new Error(err);
    }

    try {
      val = parseInt(val);
      //val = fromPercent(val);
      trace ? log("i", ln, `val=`, val) : null;
      let reg = await this.setParams({ AO: val });
      return reg;
    } catch (error) {
      log("e", ln, "Error:", error);
    }
  }

  async getDI() {
    let trace = 1,
      ln = this.ln + "getDI(" + val + ")::";
    try {
      //val = fromPercent(val);
      trace ? log("i", ln, `val=`, val) : null;
      let reg = await device.setRegPromise({
        iface: this.iface,
        id: this.id,
        regName: "AO",
        value: val,
      });
      trace ? log("i", ln, `reg=`, reg) : null;
    } catch (error) {}
  }
} //class

module.exports = MaxPRO_645;
