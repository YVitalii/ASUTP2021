/**
 * Класс, що керує роботою блоку вводу-виводу WAD-MIO-MAXPro-645
 */
const device = require("./driver.js"); //драйвер приладу
const log = require("../../tools/log.js");
const trySomeTimes = require("../../tools/trySomeTimes.js");
const { response } = require("express");
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
      // аналоговий вихід, в цьому полі також зберігається поточне завдання
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

  getId() {
    return this.id;
  }

  // ----------------------------- getParams() -----------------------

  /**
   * Функція зчитує параметри з фізичного приладу, записує в this.params,
   * та повертає новий обєкт з потрібним переліком регістрів та їх значень
   * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою "AO; AI; DO; DI"
   * @returns {Promise} - fulfilled: {"AO":{value:50,timestamp,...}, rejected: Error
   */

  async getParams(params = "tT") {
    let trace = 0;
    let ln = this.ln + `getParams(${params})::`;
    trace ? console.log(ln, `Started.`) : null;
    let response = {};
    let start = new Date();
    let resString = ""; // рядок з описом об'єкту трасування

    // розбиваємо рядок запиту в масив

    let listRegs = params.split(";");

    // --- цикл запиту всіх апараметрів в списку --------------
    for (let i = 0; i < listRegs.length; i++) {
      let trace = 0;
      let item = listRegs[i].trim();
      if (item == "") {
        continue;
      }
      trace ? console.log(ln, "get for: " + item) : null;
      // якщо такого регістра немає в переліку станів беремо наступний
      if (!this.state[item]) {
        log("e", ln, `Регістра ${item} не знайдено в states`);
        continue;
      }

      // робимо посилання на state[item] для скорочення наступного коду
      let currReg = this.state[item];

      // перевіряємо чи є в нас свіжі дані, і якщо є - відразу повертаємо їх → наступна ітерація
      if (start.getTime() - currReg.timestamp.getTime < currReg.obsolescense) {
        resString += `${item}=[${currReg.value}]; `;
        response[item] = currReg;
        continue;
      }

      // робимо запит в прилад по інтерфейсу
      let res = await this.trySomeTimes(device.getRegPromise, {
        iface: this.iface,
        id: this.id,
        regName: item,
      });

      trace ? console.log(ln, item, "=", res[0].value) : null;

      // додаємо отримані дані в відповідь
      response[item] = res[0];

      // оновлюємо дані в state
      currReg.value = res[0].value;
      currReg.timestamp = res[0].timestamp;
      currReg.source = res[0];
      trace ? log(ln, `currReg=`, currReg) : null;
      // додаємо інформацію для повідомлення в консолі
      resString += `${item}=${res[0].value}; `;
    } //for
    // виводимо результат в консоль
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    if (trace) {
      log(ln, new Date().toLocaleTimeString(), ">> response=", response);
    }
    //trace ? log("i", resString) : null;
    return response;
  }

  // ----------------------------- setParams() -----------------------

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними: {tT:50; o:10,...} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   * @returns {Promise} - resolved ({tT:50,o:10,...}) / Error
   */
  async setParams(params = null) {
    let trace = 0;
    let ln = this.ln + `setParams():: `;
    trace ? console.log(ln, "Started") : null;
    let err = ""; // опис помилки
    let resString = ln; // рядок відповіді
    let resObj = {}; // об'єкт відповіді
    if (trace) {
      log("i", ln, `params=`);
      console.dir(params);
    }
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
      let trace = 1;
      trace = prop == "DO" ? 1 : 0;

      if (params.hasOwnProperty(prop)) {
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        // даємо запит на запис
        let value = params[prop];
        trace ? log(ln, `params[${prop}]=`, params[prop]) : null;

        try {
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
          //
          response[prop] = value;
          // оновлюємо дані в state
          let reg = this.state[prop]; // посилання на регістр в this.state для скорочення коду
          reg.value = value; // в приладі повертається тільки кількість записаних регістрів, тому значення беремо з запиту
          reg.timestamp = res.timestamp;
          resString += `${prop}=${value}; `;
          trace ? log("i", ln, `reg=`, reg) : null;
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
    trace ? log("i", ln, resString) : null;
    return response;
    // if (trace) {
    //   console.log(ln, "this.state=");
    //   console.dir(this.state);
    // }
  }

  /* ---------------------- AI ---------------------------- */
  /** Отримує значення з аналогового входу */
  async getAI() {
    let trace = 0,
      ln = this.ln + "getAI()::";
    let currTime = new Date().getTime();
    trace ? log("i", ln, `Started`) : null;
    // якщо актуальність даних ще не втратилась, відразу повертаємо дані
    if (currTime - this.state.AI.timestamp <= this.state.AI.period) {
      return this.state.AI.value;
    }
    // запит даних з приладу
    try {
      let reg = await this.getParams("AI");
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = reg.AI.value;
      trace ? log("i", ln, `val=`, val) : null;
      this.state.AI.source = reg.AI;
      this.state.AI.timeStamp = new Date();
      this.state.AI.value = val;

      return val;
    } catch (error) {
      if (trace) {
        log("e", ln, `error=`);
        console.dir(error);
      }
      //log("e", ln, error);
      throw error;
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
    let trace = 0,
      ln = this.ln + "getAO()::";
    let currTime = new Date().getTime();
    trace ? log("i", ln, `Started`) : null;
    // запит даних з приладу
    try {
      let reg = await this.getParams("AO");
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = reg.AO.value;

      trace ? log("i", ln, `val=`, val) : null;
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
    // flowScale.high;
    try {
      val = parseInt(val);
      //val = fromPercent(val);
      log("i", ln, `val=`, val);
      let reg = await this.setParams({ AO: val });
      return reg.AO;
    } catch (error) {
      log("e", ln, "Error:", error);
      throw error;
    }
  }

  async getDI() {
    let trace = 0,
      ln = this.ln + "getDI(" + ")::";
    trace ? log(ln, `Started`) : null;
    try {
      let reg = await this.getParams("DI");
      trace ? log("i", ln, `reg=`, reg) : null;
      return reg.DI.value ? 1 : 0;
    } catch (error) {
      log("e", ln, "Error:", error);
      console.dir(error);
    }
  }

  async setDI(val = null) {
    let trace = 1,
      ln = this.ln + "setDI()::";
    let res = ln + "Error! DI is only for reading !!!";
    return reject(new Error(res));
  }

  async getDO() {
    let trace = 0,
      ln = this.ln + "getDO(" + ")::";
    trace ? log(ln, `Started`) : null;
    try {
      let reg = await this.getParams("DO");
      trace ? log("i", ln, `reg=`, reg) : null;
      return reg.DO.value ? 1 : 0;
    } catch (error) {
      log("e", ln, "Error:", error);
      console.dir(error);
    }
  }

  async setDO(value = null) {
    if (value === null) {
      throw new Error(this.ln + "setDO()::" + "Function mast have value! ");
    }
    value ? 1 : 0;

    let trace = 1,
      ln = this.ln + "setDO(" + Number(value) + ")::";
    trace ? log(ln, `Started`) : null;

    try {
      let reg = await this.setParams({ DO: Number(value) });
      trace ? log("i", ln, `reg=`, reg) : null;
      this.state.DO.value = value; // запамятовуэмо встановлене значення регістру
      return value; // в відповіді тільки кількість байт, value - немає, тому підставляємо з запиту
    } catch (error) {
      log("e", ln, "Error:", error);
      console.dir(error);
    }
  }
} //class

module.exports = MaxPRO_645;
