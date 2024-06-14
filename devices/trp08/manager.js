/**
 * 2024-03-29 Додав функцію getCompactHtml
 */
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
// const path = require("path");
const ClassDeviceManagerGeneral = require("../classDeviceGeneral/ClassDeviceManagerGeneral.js");

const path = require("path");

/** @class
 * Клас створює об'єкт, що репрезентує терморегулятор ТРП-08
 */

class Manager extends ClassDeviceManagerGeneral {
  /**
   * Конструктор
   * @param {Number} props.addT=0 - зміщення завдання для конкретного приладу (потрібно вручну додавати до завдання tT в кроці)
   * @param {Number} props.header={ua,en..} - назва приладу
   */

  constructor(props = {}) {
    let trace = 1,
      ln = `trp08_Manager::constructor::`;
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    props.driver = driver;
    // назва приладу для відображення
    props.header =
      props.header && props.header.ua
        ? props.header
        : {
            ua: `ТРП-08-[${props.addr}]`,
            en: `TRP-08-[${props.addr}]`,
            ru: `ТРП-08-[${props.addr}]`,
          };
    super(props);
    ln = this.ln + `constructor::`;
    // this.trace = 0; // дозвіл трасування
    // this.ln = `managerTRP08(addr=${addr}):`; // заголовок трасування

    if (this.addr < 1 || this.addr > 32) {
      throw new Error("id виходить з дозволеного діапазону адрес:" + this.addr);
    }

    // добавка температури, потрібно враховувати вручну при формуванні завдання
    // наприклад верхня зона +5С, середня +3С, нижня + 0С,
    // щоб тепло з нижніх зон не йшло догори,
    // інакше постійно працює тільки нижня зона, а верхні сачкують бо підігр. знизу
    this.addT = isNaN(parseInt(props.addT)) ? 0 : parseInt(props.addT);
    // періоди опитування
    let period = { high: 10, middle: 20, low: 60 };
    let dC = { ua: `°C`, en: `°C`, ru: `°C` };
    let dM = { ua: `хв`, en: `minutes`, ru: `минуты` };
    // поточні налаштування приладу
    this.addRegister([
      {
        id: "T",
        units: dC,
        header: { ua: `T`, en: `T`, ru: `T` },
        comment: {
          ua: `Поточна температура`,
          en: `Current temperature`,
          ru: `Текущая температура`,
        },
        obsolescence: period.high, //с, період за який дані застаріють
        type: "number",
        min: 0,
        max: 1500,
        readonly: true,
      },

      {
        id: "regMode",
        header: { ua: `Завдання`, en: `Task`, ru: `Задание` },
        comment: {
          ua: `Закон регулювання`,
          en: `Regulation type`,
          ru: `Закон регулирования`,
        },
      },
      {
        id: "tT",
        units: dC,
        comment: {
          ua: `Цільова температура`,
          en: `Task temperature`,
          ru: `Целевая температура`,
        },
        type: "number",
        min: 0,
        max: 1500,
      },
      {
        id: "H",
        units: dM,
        comment: {
          ua: `Час нагрівання`,
          en: `Heating time`,
          ru: `Время нагревания`,
        },
        type: "timer",
        min: 0,
        max: 99 * 60,
      },
      {
        id: "Y",
        units: dM,
        comment: {
          ua: `Час витримки`,
          en: `Holding time`,
          ru: `Время удержания`,
        },
        type: "timer",
        min: 0,
        max: 99 * 60,
      },
      {
        id: "o",
        header: { ua: `o`, en: `o`, ru: `o` },
        type: "number",
        min: 0,
        max: 1000,
      },
      {
        id: "ti",
        type: "number",
        min: 0,
        max: 9990,
      },
      {
        id: "td",
        type: "number",
        min: 0,
        max: 9990,
      },
      {
        id: "u",
        type: "number",
        min: 0,
        max: 990,
      },
      {
        id: "timer",
      },
    ]);

    this.addRegister({
      id: "state",
      obsolescence: period.middle, //період за який дані застаріють
      comment: {
        ua: `Стан приладу`,
        en: `Device state`,
        ru: `Состояние прибора`,
      },
    });
    this.regs.state.states = {
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
    };

    log("w", `${this.ln}:: ===>  Device was created. `);
    trace = 0;
    if (trace) {
      log("i", ln, `this.regs=`);
      console.dir(this.regs);
    }

    this.testOffline();
  } //constructor

  /** Використовується зовнішнім кодом
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
      props.ti > max ? max : props.ti;
      props.td = regs.td ? parseInt(regs.td * 100) : 0;
      props.td > max ? max : props.td;
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
    let ln = this.ln + `start()::`;
    trace ? log("w", ln, "Started") : null;
    regs = this.parseRegs(regs);

    ln = this.ln + `start(${JSON.stringify(regs)})::`;
    trace ? log("w", ln, "Parsed") : null;

    try {
      // зупинка приладу
      let state = await this.getRegister("state");
      if (state.value != 1) {
        await this.stop();
        trace ? log("w", ln, `state= ${state.value}. Device stoped`) : null;
      }

      // запис налаштувань
      await this.setParams(regs);
      trace ? log("w", ln, "Params was setted!") : null;
      // запуск на виконання
      await this.setParams({ state: 17 });
      //await this.getParams("state");
      this.regs.T.obsolescense = 10; // скорочуємо період оновлення даних до 10 с
      log("w", ln, "Device started");
      return 1;
    } catch (error) {
      log("e", ln, "Error:", error);
    }
  }

  /** для сумісності з попереднім кодом, раніше регістри повертала функція getState()
   *  потім в ClassDeviceManagerGeneral перейменував на getRegs( ), так зрозуміліше
   */
  getState() {
    return this.regs.state.getAll();
  }

  async stop() {
    let trace = 1;
    let ln = this.ln + `stop()::`;
    try {
      await this.setParams({ state: 1 });
      this.regs.T.obsolescense = 20; // збільшуємо період оновлення даних до 20 с
      log("w", ln, "Stoped.");
      return 1;
    } catch (error) {
      log("e", ln, "Error:", error.message);
      setTimeout(() => {
        this.stop();
      }, 2000);
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
      let res = await this.getRegister("T");
      if (trace) {
        log("i", ln, `res=`);
        console.dir(res);
      }
    } catch (error) {
      log("e", this.ln, "Помилка зчитування температури");
      return Promise.reject(error);
    }

    trace ? console.log(ln, "Completed t=" + this.regsT.value) : null;
    return this.regs.T.value;
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
      if (!this.regs[item]) {
        log("e", ln, `Регістра ${item} не знайдено в states`);
        continue;
      }

      // робимо запит в прилад по інтерфейсу
      let res = await this.getRegister(item);
      if (trace) {
        log("i", ln, `res=`);
        console.dir(res);
      }
      trace ? console.log(ln, item, "=", currReg.value) : null;
      response[item] = res;
      // додаємо інформацію для повідомлення в консолі
      resString += `${item}=${res}; `;
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

  testOffline() {
    if (this.offline) {
      this.regs.state.value = undefined;
    }
    setTimeout(() => {
      this.testOffline();
    }, 15 * 1000);
  }

  getCompactHtml(params = { baseUrl: "/", prefix: "" }) {
    params.prefix =
      params.prefix != ""
        ? params.prefix
        : "id" + new Date().getTime().toString().slice(-5) + "_";

    let html = "";
    let regs = this.regs;
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

  // getCompactHtml(req) {
  //   params.prefix =
  //     params.prefix != ""
  //       ? params.prefix
  //       : "id" + new Date().getTime().toString().slice(-5) + "_";

  //   let html = "";
  //   let regs = this.regs;
  //   html = pug.renderFile(
  //     req.info.homeDir + "/devices/trp08/views/compactTrp.pug",
  //     {
  //       device: this,
  //       tT: getRegForHtml(regs.tT),
  //       T: getRegForHtml(regs.T),
  //       state: getRegForHtml(regs.state),
  //       header: this.header,
  //       lang: params.lang,
  //       prefix: params.prefix,
  //       baseUrl: params.baseUrl,
  //       period: regs.T.obsolescense,
  //     }
  //   );
  //   return html;
  // }
}
function getRegForHtml(reg) {
  let res = reg.getAll();
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
