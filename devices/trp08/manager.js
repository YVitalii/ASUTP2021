//const { forEach } = require("core-js/core/array");
const device = require("./driver.js");

/** Асинхронна заглушка для імітації асинхронних операцій */
async function dummy() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      //console.log(ln, "Dummy(): Task complete");
      resolve();
    }, parseInt(Math.random() * 1000));
  });
}

/** @class
 * Клас створює об'єкт, що репрезентує терморегулятор
 */

class Manager {
  /**
   * Конструктор
   * @param {Object} iface - об'єкт до якого підключено цей прилад
   * @param {Integer} id - адреса придладу в iface
   * @param {Object} params - додаткові налаштування конкретного приладу
   * @param {Number} params.addT - зміщення завдання для приладу (автоматично додається до завдання tT, наприклад для верхньої зони: +5, середньої: +0; нижньої: -5 )
   */
  constructor(iface, id, params = {}) {
    this.trace = 1; // дозвіл трасування
    this.ln = `managerTRP08(id=${id}):`; // заголовок трасування
    this.iface = iface;
    // ----- перевіряємо id ----------------
    try {
      this.id = parseInt(id);
    } catch (error) {
      throw new Error("id неможливо перетворити в цифру:" + error.message);
    }
    if (this.id < 0 || this.id > 32) {
      throw new Error("id виходить з дозволеного діапазону адрес:" + this.id);
    }
    this.setReg = device.setRegPromise; // привязуємо драйвер
    this.getReg = device.getRegPromise; // для скорочення коду
    // добавка температури
    this.addT = params.addT ? params.addT : 0;
    // поточні налаштування приладу поки null
    this.params = {
      T: {
        value: null,
        timeStamp: null,
      },
      state: {
        value: null,
        timeStamp: null,
      },
      timer: {
        value: null,
        timeStamp: null,
      },
      regMode: {
        value: null,
        timeStamp: null,
      },
      tT: {
        value: null,
        timeStamp: null,
      },
      H: {
        value: null,
        timeStamp: null,
      },
      Y: {
        value: null,
        timeStamp: null,
      },
      o: {
        value: null,
        timeStamp: null,
      },
      ti: {
        value: null,
        timeStamp: null,
      },
      td: {
        value: null,
        timeStamp: null,
      },
      u: {
        value: null,
        timeStamp: null,
      },
    }; //params
    this.getParams("state; T; timer; regMode; tT; H; Y; o; ti; td; u");
  }

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними, які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   */

  async setParams(params = {}) {
    let trace = this.trace ? this.trace : 0;
    let ln = this.ln + `setParams(tT=${params.tT},..)::`;
    trace ? console.log(ln, "Started") : null;
    let err = "";
    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (obj.hasOwnProperty(prop)) {
        trace ? console.log(ln, `params[${prop}]=`, params[prop]) : null;
        if (!device.has(prop)) {
          console.err(`В драйвері не знайдено регістра ${prop}. Ігноруємо.`);
          continue;
        }
        // даємо запит на запис
        try {
          let res = await this.setReg(this.iface, this.id, prop, params[prop]);
        } catch (error) {
          throw new Error(error.message);
        }
      }
    }
    await dummy(); //заглушка
    trace ? console.log(ln, "Completed") : null;
  }

  async start() {
    let trace = this.trace ? this.trace : 0;
    let ln = this.ln + `start()::`;
    trace ? console.log(ln, "Started") : null;
    await dummy(); //заглушка
    trace ? console.log(ln, "Completed") : null;
  }
  async stop() {
    let trace = this.trace ? this.trace : 0;
    let ln = this.ln + `stop()::`;
    trace ? console.log(ln, "Started") : null;
    await dummy(); //заглушка
    trace ? console.log(ln, "Completed") : null;
  }
  async getT() {
    let trace = this.trace ? this.trace : 0;
    let ln = this.ln + `getT()::`;
    trace ? console.log(ln, "Started") : null;
    await dummy(); //заглушка
    let t = parseInt(Math.random() * 1000);
    trace ? console.log(ln, "Completed t=" + t) : null;
    return t;
  }

  /**
   * Функція зчитує параметри з фізичного приладу, записує в this.params,
   * та повертає новий обєкт з потрібним переліком регістрів
   * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою
   * @returns {Promise}
   */
  async getParams(params = "tT") {
    let trace = this.trace ? this.trace : 0;
    let ln = this.ln + `getParams()::`;
    trace ? console.log(ln, `Started for ${params}`) : null;
    let listRegs = params.split(";");
    for (let i = 0; i < listRegs.length; i++) {
      let item = listRegs[i].trim();
      if (item == "") {
        continue;
      }
      trace ? console.log(ln, "get for: " + item) : null;
      let res = await this.trySomeTimes(device.getRegPromise, {
        iface: this.iface,
        id: this.id,
        regName: item,
      });
    }
    // await dummy(); //заглушка
    // let res = this.trySomeTimes(device.getRegPromise,params) //{ tT: 500, T: 480 };
    if (trace) {
      console.log(ln, "Completed:" + "res=");
      console.dir(res);
    }
    return res;
  }
  trySomeTimes(item, params) {
    return new Promise(async (resolve, reject) => {
      let trace = 1,
        ln = this.ln + "trySomeTimes(" + params.regName + ")::";
      let res = null;
      for (let i = 0; i < 3; i++) {
        trace ? console.log(ln, "Спроба:" + i) : null;
        try {
          res = await item(params);
          trace ? console.log(ln, "res=") : null;
          trace ? console.dir(res) : null;
          resolve(res);
          break;
        } catch (error) {
          console.error(ln, "Невдала спроба:" + error);
          continue;
        }
        //await item(params);
      }
    });
  }
}

module.exports = Manager;

if (!module.parent) {
  let device = new Manager({}, 1);
  (async function () {
    await device.setParams({ tT: 500 });
    await device.start();
    await device.stop();
    await device.getT();
    await device.getParams();
  })();
}
