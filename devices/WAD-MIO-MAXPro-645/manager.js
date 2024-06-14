/**
 * Класс, що керує роботою блоку вводу-виводу WAD-MIO-MAXPro-645
 */
const driver = require("./driver.js"); //драйвер приладу
const log = require("../../tools/log.js");
const pug = require("pug");
const ClassDeviceManagerGeneral = require("../classDeviceGeneral/ClassDeviceManagerGeneral.js");

function toPercent(val = 0) {
  val -= 4; //зміщення на 4 мА вниз
  return (100 * val) / 16;
}

function fromPercent(val = 0) {
  return (val / 100) * 16 + 4;
}

class MaxPRO_645 extends ClassDeviceManagerGeneral {
  /**
   * @param {Object} iface - об'єкт інтерфейсу RS485 до якого підключено цей прилад
   * @param {Integer} id - адреса приладу в iface
   * @param {Object} props - об'єкт з налаштуваннями
   * */
  constructor(props) {
    props.driver = driver;
    // назва приладу для відображення
    props.header =
      props.header && props.header.ua
        ? props.header
        : {
            ua: `MaxPro645-[${props.addr}]`,
            en: `MaxPro645-[${props.addr}]`,
            ru: `MaxPro645-[${props.addr}]`,
          };
    super(props);
    let trace = 1,
      ln = this.ln + `constructor::`;

    // періоди опитування
    // потрібно придбати параметр period так як менеджер приладу не володіє інформацією
    // як часто змінюються його регістри, це має знати процесс-менеджер.
    // Наприклад перевірку на   відкриття дверей можна робити 1 раз/ 10 сек, так як це рідка подія
    // в той же час КВ Двері відкриті потрібно опитувати не рідше 1 разу/сек, особливо
    //  в процесі переміщення дверей
    let period = { high: 10, middle: 30, low: 60 };
    let percent = { ua: `%`, en: `%`, ru: `%` };
    // ------------ AI -------------------------
    this.addRegister({
      id: "AI",
      units: percent,
      header: { ua: `AI`, en: `AI`, ru: `AI` },
      comment: {
        ua: `Аналоговий вхід`,
        en: `Analog input`,
        ru: `Аналоговый вход`,
      },
      obsolescence: period.high, //с, період за який дані застаріють
      type: "number",
      min: 0,
      max: 100,
      readonly: true,
    });

    // ------------ AO -------------------------
    this.addRegister({
      id: "AO",
      units: percent,
      header: { ua: `AO`, en: `AO`, ru: `AO` },
      comment: {
        ua: `Аналоговий вихід`,
        en: `Analog output`,
        ru: `Аналоговый выход`,
      },
      obsolescence: period.high, //с, період за який дані застаріють
      type: "number",
      min: 0,
      max: 100,
      readonly: false,
    });

    // ------------ DI -------------------------
    this.addRegister({
      id: "DI",
      units: percent,
      header: { ua: `DI`, en: `DI`, ru: `DI` },
      comment: {
        ua: `Дискретний вхід`,
        en: `Digital input`,
        ru: `Дискретный вход`,
      },
      obsolescence: period.medium, //с, період за який дані застаріють
      type: "number",
      min: 0,
      max: 1,
      readonly: true,
    });

    // ------------ DO -------------------------
    this.addRegister({
      id: "DO",
      units: percent,
      header: { ua: `DO`, en: `DO`, ru: `DO` },
      comment: {
        ua: `Дискретний вихід`,
        en: `Digital output`,
        ru: `Дискретный выход`,
      },
      obsolescence: period.medium, //с, період за який дані застаріють
      type: "number",
      min: 0,
      max: 1,
      readonly: false,
    });
  } //constructor

  // // ----------------------------- getParams() -----------------------

  // /**
  //  * Функція зчитує параметри з фізичного приладу, записує в this.params,
  //  * та повертає новий обєкт з потрібним переліком регістрів та їх значень
  //  * @param {String} params - рядок зі списком параметрів, розподілених крапкою з комою "AO; AI; DO; DI"
  //  * @returns {Promise} - fulfilled: {"AO":{value:50,timestamp,...}, rejected: Error
  //  */

  // async getParams(params = "AO") {
  //   let trace = 0;
  //   let ln = this.ln + `getParams(${params})::`;
  //   trace ? console.log(ln, `Started.`) : null;
  //   let response = {};
  //   let start = new Date();
  //   let resString = ""; // рядок з описом об'єкту трасування

  //   // розбиваємо рядок запиту в масив

  //   let listRegs = params.split(";");

  //   // --- цикл запиту всіх апараметрів в списку --------------
  //   for (let i = 0; i < listRegs.length; i++) {
  //     let trace = 0;
  //     let item = listRegs[i].trim();
  //     if (item == "") {
  //       continue;
  //     }
  //     trace ? console.log(ln, "get for: " + item) : null;
  //     // якщо такого регістра немає в переліку станів беремо наступний
  //     if (!this.state[item]) {
  //       log("e", ln, `Регістра ${item} не знайдено в states`);
  //       continue;
  //     }

  //     // робимо посилання на state[item] для скорочення наступного коду
  //     let currReg = this.state[item];

  //     // перевіряємо чи є в нас свіжі дані, і якщо є - відразу повертаємо їх → наступна ітерація
  //     if (start.getTime() - currReg.timestamp.getTime < currReg.obsolescense) {
  //       resString += `${item}=[${currReg.value}]; `;
  //       response[item] = currReg;
  //       continue;
  //     }

  //     // робимо запит в прилад по інтерфейсу
  //     let res = await this.trySomeTimes(device.getRegPromise, {
  //       iface: this.iface,
  //       id: this.id,
  //       regName: item,
  //     });

  //     trace ? console.log(ln, item, "=", res[0].value) : null;

  //     // додаємо отримані дані в відповідь
  //     response[item] = res[0];

  //     // оновлюємо дані в state
  //     currReg.value = res[0].value;
  //     currReg.timestamp = res[0].timestamp;
  //     currReg.source = res[0];
  //     trace ? log(ln, `currReg=`, currReg) : null;
  //     // додаємо інформацію для повідомлення в консолі
  //     resString += `${item}=${res[0].value}; `;
  //   } //for
  //   // виводимо результат в консоль
  //   resString += ` duration ${
  //     (new Date().getTime() - start.getTime()) / 1000
  //   } sec`;
  //   if (trace) {
  //     log(ln, new Date().toLocaleTimeString(), ">> response=", response);
  //   }
  //   //trace ? log("i", resString) : null;
  //   return response;
  // }

  // // ----------------------------- setParams() -----------------------

  // /** Функція записує налаштування в прилад
  //  * @param {Object} params - об'єкт з даними: {tT:50; o:10,...} які відповідають переліку регістрів в драйвері (запустити в консолі driver.js)
  //  * @returns {Promise} - resolved ({tT:50,o:10,...}) / Error
  //  */
  // async setParams(params = null) {
  //   let trace = 0;
  //   let ln = this.ln + `setParams():: `;
  //   //trace ? console.log(ln, "Started") : null;
  //   let err = ""; // опис помилки
  //   let resString = ln; // рядок відповіді
  //   let resObj = {}; // об'єкт відповіді
  //   // if (trace) {
  //   //   log("i", ln, `params=`);
  //   //   console.dir(params);
  //   // }
  //   //якщо параметри не об'єкт повертаємо помилку
  //   if (typeof params !== "object") {
  //     let res = ln + "Error: params must be an object.";
  //     log("e", res);
  //     throw new Error(res);
  //     return;
  //   }

  //   let start = new Date(); // запамятовуємо момент виклику функції

  //   // перебираємо всі параметри в запиті
  //   for (let prop in params) {
  //     let trace = 0;
  //     //trace = prop == "DO" ? 1 : 0;

  //     if (params.hasOwnProperty(prop)) {
  //       // перевірка наявності регістра виконується в драйвері, тому на цьому етапі не потрібна
  //       // даємо запит на запис
  //       let value = params[prop];
  //       trace ? log(ln, `params[${prop}]=`, params[prop]) : null;

  //       try {
  //         value = parseInt(value);
  //         let params = {
  //           iface: this.iface,
  //           id: this.id,
  //           regName: prop,
  //           value: value,
  //         };
  //         // if (trace) {
  //         //   log("i", ln, `params=`);
  //         //   console.dir(params);
  //         // }
  //         let res = await this.trySomeTimes(device.setRegPromise, params);
  //         if (trace) {
  //           log("i", ln, `res=`);
  //           console.dir(res);
  //         }
  //         //
  //         response[prop] = value;
  //         // оновлюємо дані в state
  //         let reg = this.state[prop]; // посилання на регістр в this.state для скорочення коду
  //         reg.value = value; // в приладі повертається тільки кількість записаних регістрів, тому значення беремо з запиту
  //         reg.timestamp = res.timestamp;
  //         resString += `${prop}=${value}; `;
  //         trace ? log("i", ln, `reg=`, reg) : null;
  //       } catch (error) {
  //         log("e", ln, error);
  //         throw error;
  //         //throw ror(error.message);
  //       }
  //     }
  //   }

  //   resString += ` duration ${
  //     (new Date().getTime() - start.getTime()) / 1000
  //   } sec`;
  //   trace ? log("i", ln, resString) : null;
  //   return response;
  //   // if (trace) {
  //   //   console.log(ln, "this.state=");
  //   //   console.dir(this.state);
  //   // }
  // }

  /* ---------------------- AI ---------------------------- */
  /** Отримує значення з аналогового входу */
  async getAI() {
    let trace = 0,
      ln = this.ln + "getAI()::";
    trace ? log("i", ln, `Started`) : null;
    // запит даних з приладу
    try {
      let reg = await this.getRegister("AI");
      trace ? log("i", ln, `reg=`, reg) : null;
      let val = reg;
      trace ? log("i", ln, `val=`, val) : null;
      this.regs.AI.source = reg.AI;
      this.regs.AI.timeStamp = new Date();
      this.regs.AI.value = val;
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
      let reg = await this.getRegister("AO");
      trace ? log("i", ln, `reg=`, reg) : null;
      // let val = reg.AO.value;

      // trace ? log("i", ln, `val=`, val) : null;
      // this.regs.AO.timeStamp = new Date();
      // this.regs.AO.value = val;
      return reg;
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
      if (val < 0) {
        val = 0;
        log(
          "e",
          "Value must be greater then 0, but received val=",
          val,
          ". Value was setted '0'"
        );
      }
      if (val > 100) {
        val = 100;
        log(
          "e",
          "Value must be less then 100, but received val=",
          val,
          ". Value was setted '100'"
        );
      }

      let reg = await this.setRegister("AO", val);
      return reg.AO;
    } catch (error) {
      log("e", ln, "Error:", error);
      throw error;
    }
  }

  /**
   * Читає та повертає стан digital input
   * @returns
   */
  async getDI() {
    let trace = 1,
      ln = this.ln + "getDI()::";
    trace ? log(ln, `Started`) : null;
    try {
      let reg = await this.getRegister("DI");
      trace ? log("i", ln, `reg=`, reg) : null;
      return reg ? 1 : 0;
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
      let reg = await this.getRegister("DO");
      trace ? log("i", ln, `reg=`, reg) : null;
      return reg ? 1 : 0;
    } catch (error) {
      log("e", ln, "Error:", error);
      console.dir(error);
    }
  }

  async setDO(value = null) {
    if (value === null) {
      throw new Error(this.ln + "setDO()::" + "Function must have value! ");
    }
    value = value ? 1 : 0;

    let trace = 0,
      ln = this.ln + "setDO(" + value + ")::";
    trace ? log(ln, `Started`) : null;

    try {
      let reg = await this.setRegister("DO", Number(value));
      return reg; // в відповіді тільки кількість байт, value - немає, тому підставляємо з запиту
    } catch (error) {
      log("e", ln, "Error:", error);
      console.dir(error);
    }
  }
} //class

module.exports = MaxPRO_645;
