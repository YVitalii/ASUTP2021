//const { forEach } = require("core-js/core/array");
const device = require("./driver.js");
const log = require("../../tools/log.js");

/** @class
 * Клас створює об'єкт, що репрезентує багатофункціональний
 */
class Manager {
  /**
   * Конструктор
   * @param {Object} iface - об'єкт до якого підключено цей прилад
   * @param {Integer} id - адреса придладу в iface
   */

  constructor(iface, id) {
    this.trace = 1; // дозвіл трасування
    this.ln = `managerAkon(id=${id}):`; // заголовок трасування
    this.iface = iface;
    // ----- перевіряємо id ----------------
    if (!id) {
      throw new Error("Не вказана адреса приладу id=" + id);
    }
    if (this.id < 1 || this.id > 32) {
      throw new Error("id виходить з дозволеного діапазону адрес:" + this.id);
    }
    try {
      this.id = parseInt(id);
    } catch (error) {
      throw new Error("id неможливо перетворити в цифру:" + error.message);
    }

    // вираховуємо час останнього оновлення регістрів на 10 хв менше ніж тепер
    let startTime = new Date().getTime() - 600000;

    // поточні налаштування приладу поки null
    this.state = {
      SN: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      AI: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 20 * 1000, //період за який дані застаріють
      },
      DI: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 20 * 1000, //період за який дані застаріють
      },
      AO: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 20 * 1000, //період за який дані застаріють
      },
      DO: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 20 * 1000, //період за який дані застаріють
      }
    }; //params
    setTimeout(() => {
      let req = "SN; AI; DI; AO; DO";
      log("i", req);
      this.getParams(req);
    }, 10000);
    log(
      "w",
      `${this.ln}:: ===>  Device(id= ${
        this.id
      }) was created at ${new Date().toLocaleTimeString()} `
    );
  }

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними: {SN:392770622; AI:13.99,..} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   */
  async setParams(params = {}) {
    let trace = 0;
    let ln = this.ln + `setParams():: `;
    trace ? console.log(ln, "Started") : null;
    let start = new Date();
    let resString = ln + `at ${start.toLocaleTimeString()} ::`;
    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (params.hasOwnProperty(prop)) {
        trace ? log(ln, `params[${prop}]=`, params[prop]) : null;
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        // даємо запит на запис
        try {
          let value = params[prop];
          let res = await this.trySomeTimes(device.setRegPromise, {
            iface: this.iface,
            id: this.id,
            regName: prop,
            value: value,
          });
          // оновлюємо дані в state
          let reg = this.state[prop];
          reg.value = res.value;
          reg.timestamp = res.timestamp;
          resString += `${prop}=${res.value}; `;
        } catch (error) {
          log("e", ln, error);
          //throw new Error(error.message);
        }
      }
    }
    //await dummy(); //заглушка
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    log("w", resString);
    // if (trace) {
    //   console.log(ln, "this.state=");
    //   console.dir(this.state);
    // }
  }

  getId() {
    return this.id;
  }

  /**
   * Функція зчитує параметри з фізичного приладу, записує в this.params,
   * та повертає новий обєкт з потрібним переліком регістрів
   * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою "tT; T; dT"
   * @returns {Promise}
   */
  async getParams(params = "SN") {
    let trace = 0;
    let ln = this.ln + `getParams(${params})::`;
    trace ? console.log(ln, `Started.`) : null;
    let response = {};
    let start = new Date();
    let resString = ln + `  ${start.toLocaleTimeString()} ::`;
    let listRegs = params.split(";");
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

      // перевіряємо чи є в нас свіжі дані, і якщо є - відразу повертаємо їх
      if (
        start.getTime() - currReg.timestamp.getTime() <
        currReg.obsolescense
      ) {
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
      currReg.regName = res[0].regName;
      currReg.note = res[0].note;
      // додаємо інформацію для повідомлення в консолі
      resString += `${item}=${res[0].value}; `;
    } //for
    // виводимо результат в консоль
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    if (trace) {
      console.log(ln, new Date().toLocaleTimeString(), "response=", resString);
    }
    trace ? log("i", resString) : null;
    return response;
  }

  /**
   * Ця функція виконує передану їй функцію item , якщо невдача то виклик повторюється тричі
   * @param {Function} item - функцію, яку потрібно виконати кілька разів
   * @param {object} params - дані що передаються в функцію item {regName,id,iface..}
   * @returns Promise
   */
  trySomeTimes(item, params) {
    // додати перевірку на тип помилки, бо коли помилка в назві регистра не потрібно повторювати тричі
    return new Promise(async (resolve, reject) => {
      let trace = 0,
        ln = this.ln + `trySomeTimes(${params.regName}=${params.value})::`;
      let res = null;
      let err = null;
      for (let i = 0; i < 3; i++) {
        trace ? console.log(ln, "Спроба:" + i) : null;
        try {
          res = await item(params);
          trace ? console.log(ln, "res=") : null;
          trace ? console.dir(res) : null;
          resolve(res);
          break;
          return;
        } catch (error) {
          log("e", ln, "Невдала спроба:" + error);
          err = error;
          continue;
        }
        //await item(params);
      } //for
      // всі спроби ненвдалі
      reject(err);
    });
  } //trySomeTimes(item, params)

  isRegActual(regName) {}
}

module.exports = Manager;

if (!module.parent) {
  let device = new Manager({}, 1);
  (async function () {
    await device.setParams({ AO: "0" });
    await device.getParams();
  })();
}