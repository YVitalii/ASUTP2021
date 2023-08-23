/**
 * Класс, що керує роботою блоку вводу-виводу WAD-MIO-MAXPro-645
 */
const device = require("./driver.js"); //драйвер приладу
const log = require("../../tools/log.js");

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
    this.ln = "MaxPro645_Manager()::";
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

    this.AI = {
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
      source: {}, // регістр, отриманий з драйверу, для дод.інформації
    };
    this.AO = {
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
    };
    this.DI = {
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
    };
    this.DO = {
      value: 0,
      timestamp: new Date().getTime() - 10 * 60 * 3600 * 1000,
      period: 10 * 60 * 1000, // на протязі 10 сек після останнього запиту дані рахуються актуальними
    };
  }
  /* ---------------------- AI ---------------------------- */
  /** Отримує значення з аналогового входу */
  async getAI() {
    let trace = 1,
      ln = this.ln + "getAI()::";
    let currTime = new Date().getTime();
    // якщо актуальність даних ще не втратилась, відразу повертаємо дані
    if (currTime - this.AI.timestamp <= this.AI.period) {
      return this.AI.value;
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
      this.AI.source = reg[0];
      this.AI.timeStamp = new Date();
      this.AI.value = val;

      return val;
    } catch (error) {
      log("e", ln, error);
    }
  } //async getAI()

  async setAI(val = null) {
    let trace = 1,
      ln = this.ln + "setAI()::";
    let res = ln + "Error! AI is only for reading !!!";
    throw new Error(res);
  }

  /* ---------------------- AO ---------------------------- */
  /** Отримує значення з аналогового виходу */
  async getAO() {
    let trace = 1,
      ln = this.ln + "getAO()::";
    let currTime = new Date().getTime();
    // якщо актуальність даних ще не втратилась, відразу повертаємо дані
    if (currTime - this.AO.timestamp <= this.AO.period) {
      return this.AO.value;
    }
    // запит даних з приладу
    try {
      let reg = await device.getRegPromise({
        iface: this.iface,
        id: this.id,
        regName: "AO",
      });
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = toPercent(reg[0].value);
      trace ? log("i", ln, `val=`, val) : null;
      this.AO.source = reg[0];
      this.AO.timeStamp = new Date();
      this.AO.value = val;

      return val;
    } catch (error) {
      log("e", ln, error);
      throw error;
    }
  } //async getAO()

  async setAO(val = null) {
    let trace = 1,
      ln = this.ln + "setAO(" + val + ")::";
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
