/**
 * 2024-03-29 Додав функцію getCompactHtml
 */
const device = require("./driver.js");
const log = require("../../tools/log.js");
const trySomeTimes = require("../../tools/trySomeTimes.js");
const pug = require("pug");
const path = require("path");
const { dummyPromise } = require("../../tools/dummy.js");

/** @class
 * Клас створює об'єкт, що репрезентує терморегулятор
 */

class Manager {
  /**
   * Конструктор
   * @param {Object} iface - об'єкт до якого підключено цей прилад
   * @param {Integer} addr - адреса приладу в iface
   * @param {Object} params - додаткові налаштування конкретного приладу
   * @param {Integer} params.id - ідентифікатор приладу в deviceManager
   * @param {Number} params.addT=0 - зміщення завдання для конкретного приладу (потрібно вручну додавати до завдання tT в кроці)
   * @param {Number} params.header={ua,en..} - назва приладу
   */

  constructor(iface, addr, params = {}) {
    this.trace = 0; // дозвіл трасування
    this.ln = `managerTRP08(addr=${addr}):`; // заголовок трасування

    // -------- інтерфейс -----------
    this.iface = iface;
    // ознака поточного циклу запису
    this.busy = false;
    // ідентифікатор приладу d deviceManager наприклад trp08_1
    this.id = params.id;
    //
    this.errorCounter = { value: 0, max: 10 };
    this.offLine = false;
    this.period = 3;

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
    // назва приладу для відображення
    this.header =
      params.header && params.header.ua
        ? params.header
        : {
            ua: `ТРП-08-[${addr}]`,
            en: `TRP-08-[${addr}]`,
            ru: `ТРП-08-[${addr}]`,
          };

    // добавка температури, потрібно враховувати вручну при формуванні завдання
    // наприклад верхня зона +5С, середня +3С, нижня + 0С,
    // щоб тепло з нижніх зон не йшло догори,
    // інакше постійно працює тільки нижня зона, а верхні сачкують бо підігр. знизу
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
    let period = { high: 10 * 1000, middle: 20 * 1000, low: 60 * 1000 };
    this.state = {
      T: {
        id: "T",
        value: null, // значення регістру
        timestamp: new Date(startTime), // відмітка часу останнього оновлення
        obsolescense: period.high, //мс, період за який дані застаріють
      },
      state: {
        id: "state",
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.middle, //період за який дані застаріють
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
        obsolescense: period.low, //період за який дані застаріють
      },
      regMode: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      tT: {
        id: "tT",
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      H: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      Y: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      o: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      ti: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      td: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
      },
      u: {
        value: null,
        timestamp: new Date(startTime),
        obsolescense: period.low, //період за який дані застаріють
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
    }, 5000);

    log("w", `${this.ln}:: ===>  Device was created. `);
  } //constructor

  /** Використовується зовнішнім кодом ???
   * Повертає зміщення температури для цього приладу
   * @returns {Number} - зміщення температури
   */
  getAddT() {
    return this.addT;
  }

  getState() {
    return this.state.state;
  }

  /**
   *
   * @param {async function} func - функція яку потрібно виконати
   * @param {*} params - параметри функції
   * @returns
   */
  async iteration(func, params) {
    return new Promise(async (resolve, reject) => {
      let trace = 0,
        ln =
          this.ln +
          `iteration(${func.name},${params.regName}${
            params.value || params.value === 0 ? "=" + params.value : ""
          })::`;
      trace ? log("i", ln, `Started`) : null;
      // очікуємо закінчення попередньої операції
      let i = 0; // лічильник повторів
      while (!this.iface.isOpened || this.busy) {
        let msg = this.iface.isOpened ? "" : "Port not opened.";
        msg += this.busy ? `Device ${this.header.ua} are busy.` : "";
        msg += `Trying N:${i}. Waiting: ${this.period}s`;
        log("", ln, msg);
        i++;
        await dummyPromise(this.period * 1000);
      }
      // даємо запит на запис
      let res,
        resString = "";
      this.busy = true;
      i = 0;
      let ok = false;
      do {
        try {
          if (!this.iface.isOpened) {
            let err = new Error();
            err.code = 13;
            err.messages = { en: ln + "Port not opened!" };
            throw err;
          }
          res = await func(params);
          ok = true;
        } catch (error) {
          log("", ln, "err=", error.messages.en);
          if (error.code != 13) {
            ok = true;
            this.busy = false;
            reject(new Error(error.messages.en));
          }
          // лічимо помилки
          this.errorCounter.value += 1;
          if (this.errorCounter.value >= this.errorCounter.max) {
            this.errorCounter.value = this.errorCounter.max;
            this.offLine = true;
            log("e", ln + "Device offline!");
            this.period = 10;
            this.state.state.value = undefined;
            return { value: null, note: "Device offline!" };
          }

          log(
            "",
            ln +
              `errCounter=${this.errorCounter.value}.Try again.. ${i} after ${this.period}s`
          );
          i++;
          await dummyPromise(this.period * 1000);
        }
      } while (!ok);
      this.busy = false;
      this.errorCounter.value = 0;
      this.offLine = false;
      this.period = 3;
      trace ? log("i", ln + "Completed") : null;
      resolve(res);
    });
  } //async iteration

  /** Функція записує 1 параметр */
  async setRegister(regName, value) {
    let trace = 0,
      ln = this.ln + `setRegister(${regName}=${value})::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.state[regName];
    // даємо запит на запис
    let res,
      resString = "";

    res = await this.iteration(device.setRegPromise, {
      iface: this.iface,
      id: this.addr,
      regName: regName,
      value: value,
    });
    // оновлюємо дані в state
    trace ? log("i", ln, `res=`, res) : null;
    reg.value = res.value;
    reg.timestamp = res.timestamp;
    resString += `${regName}=${res.value}; `;
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    return resString;
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
    let resString = "";
    // перебираємо всі параметри в запиті
    for (let prop in params) {
      if (params.hasOwnProperty(prop)) {
        trace ? log(ln, `Parsed regs[${prop}]=`, params[prop]) : null;
        // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
        let res = await this.setRegister(prop, params[prop]);
        if (trace) {
          log("i", ln, res);
          //console.dir(res);
        }
        resString += res;
      }
    }

    //await dummy(); //заглушка
    resString += ` duration ${
      (new Date().getTime() - start.getTime()) / 1000
    } sec`;
    log("i", ln, "Was setted regs:" + resString);
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
    let trace = 0,
      ln = this.ln + "parseRegs()::";
    if (trace) {
      log("i", ln, `regs=`);
      console.dir(regs);
    }
    // if (trace) {
    //   log("i", ln, `Started with regs=`);
    //   console.dir(regs);
    // }
    let props = {},
      max = 9998;
    if (regs.regMode && regs.regMode === "pid") {
      props.regMode = 1; //pid
      // точність для ti, td = 0,01 в програмі, а в приладі ціле число
      props.ti = regs.ti ? parseInt(regs.ti * 100) : 0;
      props.ti = props.ti > max ? max : props.ti;
      props.td = regs.td ? parseInt(regs.td * 100) : 0;
      props.td = props.td > max ? max : props.td;
      // точність для о = 0,1 в програмі, а в приладі ціле число
      props.o = regs.o ? parseInt(regs.o * 10) : 0;
    } else {
      props.regMode = 2; //pos
      props.o = regs.o ? Math.abs(parseInt(regs.o)) : 0; //оскільки неузгодження відємне а в ТРП - має бути позитивним - інвертуємо знак
    }
    props.o > max ? max : props.o;
    props.tT = regs.tT ? regs.tT : 0;
    props.H = regs.H ? regs.H : 0;
    props.Y = regs.Y ? regs.Y : 0;
    if (trace) {
      log("i", ln, `Parsed regs=`);
      console.dir(props);
    }
    return props;
  } //async deforeStart(regs={})

  async start(regs = {}) {
    let trace = 1;
    regs = this.parseRegs(regs);
    let ln = this.ln + `start(${JSON.stringify(regs)})::`;
    trace ? log("w", ln, "Started") : null;

    try {
      // зупинка приладу
      await this.stop();
      trace ? log("w", ln, "Device stoped") : null;
      // запис налаштувань
      await this.setParams(regs);
      trace ? log("w", ln, "Params was setted!") : null;
      // запуск на виконання
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
    let trace = 1;
    let ln = this.ln + `stop()::`;
    trace ? log("w", ln, "Started.") : null;
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
      let res = await this.getParams("T");
      if (trace) {
        log("i", ln, `res=`);
        console.dir(res);
      }
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

      // перевіряємо чи є в нас свіжі дані,  якщо є або прилад не в мережі  - відразу повертаємо їх
      if (
        start.getTime() - currReg.timestamp.getTime() < currReg.obsolescense ||
        this.offLine
      ) {
        resString += `${item}=[${currReg.value}]; `;
        response[item] = currReg;
        continue;
      }
      trace = 0;
      // робимо запит в прилад по інтерфейсу
      let res = await this.iteration(device.getRegPromise, {
        iface: this.iface,
        id: this.addr,
        regName: item,
      });
      if (trace) {
        log("i", ln, `res=`);
        console.dir(res);
      }
      currReg.value = res[0].value;
      currReg.timestamp = res[0].timestamp;

      // try {
      //   res = await device.getRegPromise({
      //     iface: this.iface,
      //     id: this.addr,
      //     regName: item,
      //   });
      //   if (trace) {
      //     log("i", ln, `res=`);
      //     console.dir(res);
      //   }
      //   currReg.value = res[0].value;
      //   currReg.timestamp = res[0].timestamp;
      //   this.busy = false;
      // } catch (error) {
      //   log("e", ln, error);
      //   currReg.value = null;
      //   this.busy = false;
      // }

      trace ? console.log(ln, item, "=", currReg.value) : null;
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

  // async getRegPromise(props) {
  //   let trace = 1,
  //     ln = `driver::getRegPromise(id=${props.id};${props.regName})::`;
  //   let res;
  //   let i = 0;
  //   while (this.busy) {
  //     log("", ln + "Device are this.busy. Waiting: ", i);
  //     await dummyPromise(2000);
  //   }
  //   this.busy = true;
  //   i = 0;
  //   let ok = false;
  //   do {
  //     try {
  //       res = await device.getRegPromise(props);
  //       ok = true;
  //       this.busy = false;
  //     } catch (error) {
  //       log("e", ln, "err=", error.messages.en);
  //       if (error.code != 13) {
  //         ok = true;
  //         this.busy = false;
  //         throw new Error(error.messages.en);
  //       }

  //       log("w", ln + `Try again.. ${i}`);
  //       i++;
  //       dummyPromise(2000);
  //     }
  //   } while (!ok);
  //   return res;
  // }

  // async setRegPromise(props) {
  //   let trace = 1,
  //     ln = `driver::setRegPromise(id=${props.id};${props.regName}=${props.value})::`;
  //   let res;
  //   let i = 0;
  //   while (this.busy) {
  //     log("", ln + "Device are busy. Waiting: ", i);
  //     await dummyPromise(2000);
  //   }
  //   this.busy = true;
  //   i = 0;
  //   let ok = false;
  //   do {
  //     try {
  //       res = await device.setRegPromise(props);
  //       ok = true;
  //       this.busy = false;
  //     } catch (error) {
  //       log("e", ln, "err=", error.messages.en);
  //       if (error.code != 13) {
  //         ok = true;
  //         this.busy = false;
  //         throw new Error(error.messages.en);
  //       }
  //       log("w", ln + `Try again.. ${i}`);
  //       i++;
  //       dummyPromise(2000);
  //     }
  //   } while (!ok);
  //   return res;
  // }

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
