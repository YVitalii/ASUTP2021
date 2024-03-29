/**
 * 2024-03-29 Додав функцію getCompactHtml
 */
const device = require("./driver.js");
const log = require("../../tools/log.js");
const trySomeTimes = require("../../tools/trySomeTimes.js");
const pug = require("pug");
const path = require("path");

/** @class
 * Клас створює об'єкт, що репрезентує терморегулятор
 */

class Manager {
  /**
   * Конструктор
   * @param {Object} iface - об'єкт до якого підключено цей прилад
   * @param {Integer} id - адреса придладу в iface
   * @param {Object} params - додаткові налаштування конкретного приладу
   * @param {Number} params.addT=0 - зміщення завдання для приладу (автоматично додається до завдання tT, наприклад для верхньої зони: +5, середньої: +0; нижньої: -5 )
   * @param {Number} params.header={ua,en..} - назва приладу
   */

  constructor(iface, id, params = {}) {
    this.trace = 1; // дозвіл трасування
    this.ln = `managerTRP08(id=${id}):`; // заголовок трасування

    // -------- інтерфейс -----------
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
    // назва приладу
    this.header =
      params.header && params.header.ua
        ? params.header
        : { ua: `ТРП-08-[${id}]`, en: `TRP-08-[${id}]`, ru: `ТРП-08-[${id}]` };

    // добавка температури
    this.addT = params.addT ? params.addT : 0;

    // вираховуємо час останнього оновлення регістрів на 10 хв менше ніж тепер
    let startTime = new Date().getTime() - 10 * 60 * 1000;

    /**
     * опис параметрів приладу ТРП-08-ТП
     * @typedef {object} regs
     * @property {Number} T - current temperature
     * @property {Number} state - current state of device see ./driver.js
     */

    // поточні налаштування приладу поки null
    this.state = {
      T: {
        value: null, // значення регістру
        timestamp: new Date(startTime), // відмітка часу останнього оновлення
        obsolescense: 20 * 1000, //мс, період за який дані застаріють
      },
      state: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 30 * 1000, //період за який дані застаріють
      },
      timer: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 60 * 1000, //період за який дані застаріють
      },
      regMode: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      tT: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      H: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      Y: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      o: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      ti: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      td: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
      u: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 180 * 1000, //період за який дані застаріють
      },
    }; //state

    for (let key in this.state) {
      let d = device.getRegDescription(key);
      let regs = this.state;
      regs[key].header = d.header ? d.header : { ua: ``, en: ``, ru: `` };
      d.type = d.type ? d.type : undefined;
      switch (d.type) {
        case "integer":
          regs[key].type = "text";
          break;
        case "clock":
          regs[key].type = "timer";
          break;
        default:
          regs[key].type = "text";
          break;
      } //switch (d.type)
    } //for(let key in regs){

    setTimeout(async () => {
      // 2025-03-29 зчитування всіх параметрів прибрав, так як дуже довго запускається
      // сервер при тестуванні, читаємо налаштування за зовнішнім запитом
      // #TODO хоча можна считувати по 1 регістру кожні 5 сек
      // let req = "state; T; timer; regMode; tT; H; Y; o; ti; td; u";
      // log("i", this.ln + ":: First reading parameters from device: " + req);
      // await this.getParams(req);

      // при ініціалізації об'єкту зупиняємо прилад так як він міг бути в стані Пуск
      await this.stop();
      log("i", this.ln, "Command 'Stop' done!");
    }, 1000);

    log("w", `${this.ln}:: ===>  Device was created. `);
  } //constructor

  /** Використовується зовнішнім кодом ???
   * Повертає зміщення температури для цього приладу
   * @returns {Number} - зміщення температури
   */
  getAddT() {
    return this.addT;
  }

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними: {tT:50; o:10,..} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   */
  async setParams(params = {}) {
    let trace = 1;
    let ln = this.ln + `setParams():: `;
    trace ? console.log(ln, "Started") : null;
    let err = "";
    let start = new Date();
    let resString = ln;
    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (params.hasOwnProperty(prop)) {
        trace ? log(ln, `params[${prop}]=`, params[prop]) : null;
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        // даємо запит на запис
        try {
          let value = params[prop];
          if (prop == "tT") {
            value += this.addT;
          }
          let res = await trySomeTimes(device.setRegPromise, {
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
          return resString;
          // if (trace) {
          //   console.log(ln, "res=");
          //   console.dir(res);
          // }
          //this.state[prop] = res;
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
    log("i", resString);
    // if (trace) {
    //   console.log(ln, "this.state=");
    //   console.dir(this.state);
    // }
  }

  async start() {
    let trace = 0;
    let ln = this.ln + `start()::`;
    trace ? log("w", ln, "Start") : null;
    try {
      await this.setParams({ state: 17 });
      this.state.T.obsolescense = 10 * 1000; // скорочуємо період оновлення даних до 10 с
      log("w", ln, "Device started");
    } catch (error) {
      log("e", ln, "Error:", error);
    }
    //await dummy(); //заглушка
    trace ? log("w", ln, "Finished") : null;
  }

  async stop() {
    let trace = 0;
    let ln = this.ln + `stop()::`;
    trace ? log("w", ln, "Device stoped") : null;
    try {
      await this.setParams({ state: 1 });
      this.state.T.obsolescense = 30 * 1000; // збільшуємо період оновлення даних до 30 с
      log("w", ln, "Stoped.");
    } catch (error) {
      log("e", ln, "Error:", error);
    }

    trace ? log("w", ln, "Finished") : null;
  }

  /** отримує температуру з приладу
   *  @return {Promise} - з результатом {Number} = поточна температура
   */
  async getT() {
    let trace = 0;
    let ln = this.ln + `getT()::`;
    trace
      ? console.log(ln, `Started at ${new Date().toLocaleTimeString()}`)
      : null;
    try {
      await this.getParams("T");
    } catch (error) {
      log("e", this.ln, "Помилка зчитування температури");
      return Promise.reject(error);
    }

    trace ? console.log(ln, "Completed t=" + this.state.T.value) : null;
    return this.state.T.value;
  }

  getId() {
    return this.id;
  }

  /**
   * Функція зчитує параметри з фізичного приладу, записує в this.params,
   * та повертає новий обєкт з потрібним переліком регістрів
   * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою "tT; T; dT"
   * @returns {Promise} - {tT:50}
   */
  async getParams(params = "tT") {
    let trace = 1;
    let ln = this.ln + `getParams(${params})::`;
    trace ? console.log(ln, `Started.`) : null;
    let response = {};
    let start = new Date();
    let resString = ln;
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
      //let res = await this.trySomeTimes(device.getRegPromise, {
      let res = await trySomeTimes(device.getRegPromise, {
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

  getCompactHtml(params = {}) {
    let html = "";
    let regs = this.state;
    html = pug.renderFile(path.resolve(__dirname + "/views/compactTrp.pug"), {
      device: this,
      tT: getRegForHtml(regs.tT),
      T: getRegForHtml(regs.T),
      state: getRegForHtml(regs.state),
      header: this.header,
      lang: params.lang,
    });
    return html;
  }
}
function getRegForHtml(reg) {
  return {
    header: reg.header,
    value: reg.value ? reg.value : "???",
    type: reg.type,
  };
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
