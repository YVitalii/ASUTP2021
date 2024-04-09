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
   * @param {Integer} id - ідентифікатор приладу в iface
   * @param {Integer} addr - адреса приладу в iface
   * @param {Object} params - додаткові налаштування конкретного приладу
   * @param {Number} params.addT=0 - зміщення завдання для приладу (автоматично додається до завдання tT, наприклад для верхньої зони: +5, середньої: +0; нижньої: -5 )
   * @param {Number} params.header={ua,en..} - назва приладу
   */

  constructor(iface, addr, params = {}) {
    this.trace = 0; // дозвіл трасування
    this.ln = `managerTRP08(addr=${addr}):`; // заголовок трасування

    // -------- інтерфейс -----------
    this.iface = iface;

    this.id = params.id;

    // ----- перевіряємо addr ----------------
    if (!addr) {
      throw new Error("Не вказана адреса приладу addr=" + addr);
    }
    if (this.addr < 1 || this.addr > 32) {
      throw new Error("id виходить з дозволеного діапазону адрес:" + this.addr);
    }
    try {
      this.addr = parseInt(addr);
    } catch (error) {
      throw new Error("addr неможливо перетворити в цифру:" + error.message);
    }
    // назва приладу
    this.header =
      params.header && params.header.ua
        ? params.header
        : {
            ua: `ТРП-08-[${addr}]`,
            en: `TRP-08-[${addr}]`,
            ru: `ТРП-08-[${addr}]`,
          };

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
        id: "T",
        value: null, // значення регістру
        timestamp: new Date(startTime), // відмітка часу останнього оновлення
        obsolescense: 5 * 1000, //мс, період за який дані застаріють
      },
      state: {
        id: "state",
        value: null,
        timestamp: new Date(startTime),
        obsolescense: 30 * 1000, //період за який дані застаріють
        states: {
          1: { ua: `Зупинка`, en: `Stoping`, ru: `Остановка` },
          7: { ua: `Зупинено`, en: `Stoped`, ru: `Остановлен` },
          13: {
            ua: `Прилад не відповідає`,
            en: `Connection failed`,
            ru: `Нет связи`,
          },
          17: { ua: `Старт`, en: `Starting`, ru: `Запуск` },
          23: { ua: `Виконання`, en: `Going`, ru: `Выполнение` },
          71: {
            ua: `Аварія сенсора`,
            en: `Sensor fail`,
            ru: `Стоп.Авария датчика`,
          },
          87: {
            ua: `Аварія сенсора`,
            en: `Sensor fail`,
            ru: `Пуск.Авария датчика`,
          },
        },
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
        id: "tT",
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
      //log("i", this.ln, "Command 'Stop' done!");
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
  /** Функція записує 1 параметр */
  async setRegister(regName, value) {
    let trace = 0,
      ln = this.ln + `setRegister(${regName}=${value})::`;
    trace ? log("i", ln, `Started`) : null;

    let reg = this.state[regName];
    // let value = params[prop];
    if (regName == "tT") {
      value += this.addT;
    }
    return new Promise(async (resolve, reject) => {
      // даємо запит на запис
      let res,
        resString = "";
      try {
        res = await trySomeTimes(device.setRegPromise, {
          iface: this.iface,
          id: this.addr,
          regName: regName,
          value: value,
        });

        // оновлюємо дані в state

        reg.value = res.value;
        reg.timestamp = res.timestamp;
        resString += `${regName}=${res.value}; `;
        if (trace) {
          log("i", ln, `reg=`);
          console.dir(reg);
        }
        resolve(resString);
      } catch (error) {
        // if (trace) {
        //   log("e", ln, `error=`);
        //   console.dir(error);
        // }
        log("e", ln, JSON.stringify(error));
        setTimeout(() => {
          this.setRegister(regName, value);
        }, 2000);
        //throw new Error(error.message);
      }
    });
  } //async setRegister(regName, value)

  /** Функція записує налаштування в прилад
   * @param {Object} params - об'єкт з даними: {tT:50; o:10,..} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
   */
  async setParams(params = {}) {
    let trace = 0;
    let ln = this.ln + `setParams():: `;
    trace ? console.log("" + ln + "Started") : null;
    let err = "";
    let start = new Date();
    let resString = ln;
    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (params.hasOwnProperty(prop)) {
        trace ? log(ln, `params[${prop}]=`, params[prop]) : null;
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        let res = await this.setRegister(prop, params[prop]);
        if (trace) {
          log("i", ln, `res=`);
          console.dir(res);
        }
        resString += res;
      }
    }

    //await dummy(); //заглушка
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    log("i", ln + resString);
    // if (trace) {
    //   console.log(ln, "this.state=");
    //   console.dir(this.state);
    // }
  }
  /**
   * Функція підлаштовує узагальнені параметри завдання
   * конкретно під ТРП-08
   * @param {Object} regs - об'єкт з налаштуваннями типу {tT:{value:10,..},H:{value:10,...}}
   *
   */
  parseRegs(regs = {}) {
    let trace = 1,
      ln = this.ln + "parseRegs()::";
    if (trace) {
      log("i", ln, `Started with regs=`);
      console.dir(regs);
    }
    let props = {};
    if (regs.regMode && regs.regMode === "pid") {
      props.regMode = 1; //pid
      props.ti = regs.ti ? regs.ti : 0;
      props.td = regs.td ? regs.td : 0;
    } else {
      props.regMode = 2; //pos
    }
    props.o = regs.o ? regs.o : 0;
    props.tT = regs.tT ? regs.tT : 0;
    props.H = regs.H ? regs.H : 0;
    props.Y = regs.Y ? regs.Y : 0;
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    return props;
  } //async deforeStart(regs={})

  async start(regs = {}) {
    let trace = 0;
    let ln = this.ln + `start()::`;
    trace ? log("w", ln, "Start") : null;

    try {
      await this.stop();
      await this.setParams(this.parseRegs(regs));
      await this.setParams({ state: 17 });
      //await this.getParams("state");
      this.state.T.obsolescense = 5 * 1000; // скорочуємо період оновлення даних до 10 с
      log("w", ln, "Device started");
      return 1;
    } catch (error) {
      log("e", ln, "Error:", error);
    }
  }

  async stop() {
    let trace = 0;
    let ln = this.ln + `stop()::`;
    trace ? log("w", ln, "Device stoped") : null;
    try {
      await this.setParams({ state: 1 });
      this.state.T.obsolescense = 10 * 1000; // збільшуємо період оновлення даних до 30 с
      log("w", ln, "Stoped.");
      return 1;
    } catch (error) {
      log("e", ln, "Error:", error.message);
      setTimeout(() => {
        this.stop();
      }, 2000);
    }

    //trace ? log("w", ln, "Finished") : null;
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

  getAddr() {
    return this.addr;
  }

  /**
   * Функція зчитує параметри з фізичного приладу, записує в this.params,
   * та повертає новий обєкт з потрібним переліком регістрів
   * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою "tT; T; dT"
   * @returns {Promise} - {tT:50}
   */
  async getParams(params = "tT") {
    let trace = 0;
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
      let res;
      try {
        res = await trySomeTimes(device.getRegPromise, {
          iface: this.iface,
          id: this.addr,
          regName: item,
        });
        currReg.value = res[0].value;
        currReg.timestamp = res[0].timestamp;
      } catch (error) {
        currReg.value = null;
      }

      trace ? console.log(ln, item, "=", currReg.value) : null;

      // response[item] = res[0];
      // оновлюємо дані в state

      //currReg.regName = res[0].regName;
      //currReg.note = res[0].note;
      // додаємо отримані дані в відповідь
      response[item] = currReg;
      // додаємо інформацію для повідомлення в консолі
      resString += `${item}=${currReg.value}; `;
    } //for
    // виводимо результат в консоль
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec; [дані з буферу]`;
    if (trace) {
      console.log(ln, new Date().toLocaleTimeString(), "response=", resString);
    }
    trace ? log("i", resString) : null;
    return response;
  }

  getCompactHtml(params = { baseUrl: "/", prefix: "" }) {
    params.prefix =
      params.prefix != ""
        ? params.prefix
        : "id" + new Date().getTime().toString().slice(-5) + "_";

    let html = "";
    let regs = this.state;
    html = pug.renderFile(path.resolve(__dirname + "/views/compactTrp.pug"), {
      device: this,

      tT: getRegForHtml(regs.tT),
      T: getRegForHtml(regs.T),
      state: getRegForHtml(regs.state),
      header: this.header,
      lang: params.lang,
      prefix: params.prefix,
      baseUrl: params.baseUrl,
      period: regs.T.obsolescense,
    });
    return html;
  }
}
function getRegForHtml(reg) {
  let res = {
    id: reg.id,
    header: reg.header,
    value: reg.value ? reg.value : "???",
    type: reg.type,
  };
  if (res.id == "state") {
    res.states = reg.states;
  }
  return res;
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
