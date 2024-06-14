const log = require("../../tools/log");
const { dummyPromise } = require("../../tools/dummy.js");
const test = require("../../config.js").test;
const clone = require("clone");
const ClassDeviceRegGeneral = require("./ClassDeviceRegGeneral.js");
const pug = require("pug");

module.exports = class ClassDeviceManagerGeneral {
  /**
   * Конструктор
   * @param {Object} props - додаткові налаштування конкретного приладу
   * @param {Object} props.iface - об'єкт інтерфейсу до якого підключено цей прилад, повинен мати функцію send()
   * @param {Integer} props.id - ідентифікатор приладу в deviceManager
   * @param {Integer} props.addr - адреса приладу в iface
   * @param {Integer} props.driver - драйвер приладу
   * @param {Number} props.header={ua,en..} - назва приладу
   * @param {Number} props.comment={ua,en..} - назва приладу
   */

  constructor(props) {
    let trace = 1,
      ln = "constructor::";

    // ----------- id -------------
    if (!props.id) {
      if (trace) {
        log("i", ln, `props=`);
        console.dir(props);
      }
      throw new Error(ln + `"id" of the device must be defined!`);
    }
    this.id = props.id;

    // ----------- iface -------------
    if (!props.iface && typeof props.iface.send == "function") {
      throw new Error(
        ln +
          `"iface" for the device must be defined and must has the function "send"!`
      );
    }
    this.iface = props.iface;

    // ----------- addr -------------
    if (!props.addr || isNaN(parseInt(props.addr))) {
      throw new Error(
        ln + `"addr=${props.addr}" of the device must be defined!`
      );
    }
    this.addr = parseInt(props.addr);

    // settings for tracing
    this.ln = `${this.id}(${this.addr})::`;
    ln = this.ln + ln;

    // ----------- driver -------------
    if (!props.driver && typeof props.driver.getRegPromise == "function") {
      throw new Error(
        ln +
          `"driver" for the device must be defined and must has the function "getRegPromise"!`
      );
    }
    this.driver = props.driver;
    this.header =
      props.header && props.header.en
        ? props.header
        : {
            ua: `undefined(${this.addr})`,
            en: `undefined(${this.addr})`,
            ru: `undefined(${this.addr})`,
          };

    // опис регістрів приладу кожний регістр - сутність типу ClassDeviceRegGeneral
    this.regs = props.regs ? props.regs : {};

    // ----------- періоди затримки -------------
    this.period = {};
    this.period.if = {
      //seconds
      portNotOpened: test ? 1 : 5,
      timeOut: test ? 2 : 5,
      error: test ? 1 : 10,
      deviceBusy: test ? 1 : 2,
    };
    // поточне значення
    this.period.value = this.period.if.portNotOpened;

    // -------- лічильник помилок -----------
    this.errorCounter = {
      value: 0, //поточне значення
      max: test ? 3 : 10, //максимальне значення
    };
    // ознака відсутності звязку з приладом
    this.offLine = false;
  } // constructor

  async start(regs = {}) {
    let trace = 1,
      ln = this.ln + `start()::`;
    trace ? log("w", ln, "Started") : null;
  }

  async stop(regs = {}) {
    let trace = 1,
      ln = this.ln + `stop()::`;
    trace ? log("w", ln, "Started") : null;
  }

  /**
   * Додає регістр до regs
   * @param {Object | Array } reg - налаштування потрібні для створення екземпляру ClassDeviceRegGeneral
   */
  addRegister(reg) {
    if (!reg) {
      throw new Error("reg = undefined");
    }
    if (Array.isArray(reg)) {
      for (let i = 0; i < reg.length; i++) {
        this.addRegister(reg[i]);
      }
      return;
    }
    let trace = 0,
      ln = this.ln + `addRegister(${reg.id})::`;
    if (!this.driver.has(reg.id)) {
      throw new Error(
        ln + `reg.id="${reg.id}" not defined in the device driver`
      );
    }
    let newReg = new ClassDeviceRegGeneral(reg);
    this.regs[newReg.id] = newReg;
    if (trace) {
      log("i", ln, `Was added the newReg=`);
      console.dir(newReg);
    }
  }

  /**
   * Перетворює список регістрів в масив
   * @param {Array | String } regsList - масив з id регістрів або рядок з сепаратором ";"
   * @returns {Araay}
   */
  parseRegsList(regsList) {
    let trace = 0,
      ln = this.ln + `parseRegsList()::`;

    if (!Array.isArray(regsList)) {
      if (typeof regsList === "string") {
        regsList = regsList.split(";");
      } else {
        throw new Error(ln + `Uncompatible argument regsList=${regsList}`);
      }
    }
    if (trace) {
      log("i", ln, `regsList=`);
      console.dir(regsList);
    }
    // перевіряємо валідність назв регістрів
    let res = [];
    for (let i = 0; i < regsList.length; i++) {
      let key = regsList[i].trim();
      trace ? log("i", ln, `key=`, key) : null;
      if (key === "") {
        trace ? log("i", ln, `Passed`) : null;
        continue;
      }
      if (this.regs[key]) {
        res.push(key);
        trace ? log("i", ln, `Pushed`) : null;
      } else {
        console.error(ln + `regName=${key} not defined!`);
      }
    }
    trace ? log("i", ln, `res=`, res) : null;
    return res;
  }

  /**
   * Повертає список поточного стану регістрів для браузера в скороченій формі
   * @param {Array | String} regsList - список id регістрів, масив або рядок з сепаратором ";"
   * @returns {Object} - {regName:this.regs[regName].value,..} наприклад {offLine:true,T:50,H:10,..}
   */
  getRegsValues(regsList = undefined) {
    let trace = 0,
      ln = this.ln + `getRegsValues()::`;
    let res = {};
    // якщо не вказано перелік регістрів - повертаємо всі
    if (regsList == undefined) {
      // якщо перелік регістрів не вказано - повертаємо всі
      for (const key in this.regs) {
        if (Object.hasOwnProperty.call(this.regs, key)) {
          res[key] = this.regs[key].value;
        }
      }
    } else {
      // вибираємо значення згідно переліку
      regsList = this.parseRegsList(regsList);
      for (let i = 0; i < regsList.length; i++) {
        const element = regsList[i];
        res[element] = this.regs[element].value;
      }
    }

    // перевіряємо актуальність значень і, за потреби, оновлюємо
    for (const key in res) {
      if (Object.hasOwnProperty.call(res, key)) {
        key;

        if (this.regs[key].isActual()) {
          continue;
        }
        if (!this.offLine) {
          trace
            ? log(
                "i",
                ln,
                `key=`,
                key,
                ":: Was requested the current value from device."
              )
            : null;
          this.getRegister(key);
        }
      }
    }
    res.offLine = this.offLine;
    return res;
  }

  /**
   * Очікує поки порт не відкриється
   */
  async testPortOpened() {
    let trace = 0,
      ln = this.ln + "testPortOpened()::";
    let errors = 10;
    while (!this.iface.isOpened) {
      errors = errors <= 0 ? 0 : errors - 1;
      let period = this.period.if.portNotOpened * (errors == 0 ? 2 : 1);
      trace
        ? log(
            "i",
            ln,
            `Port not opened! errors=${errors}, waiting ${period} sek`
          )
        : null;
      await dummyPromise(period * 1000);
    }
    trace ? log("i", ln, `Port opened!`) : null;
    return 1;
  }

  /** Повертає повний опис регістру */
  getRegForHtml(regName) {
    let trace = 1,
      ln = this.ln + `getRegForHtml${regName}::`;
    let reg = this.regs[regName];
    if (!regName || !reg) {
      throw new Error(ln + "regName not finded!");
    }
    return reg.getAll();
  }

  /**
   * Виконує запит по фізичному інтерфейсу, якщо інтерфейс ще не відкритий
   * - очікує його відкриття, посилає запит → встановлює прапорець this.busy →
   * після  відповіді/помилки → скидає прапорець this.busy → якщо timeout
   * → встановлює прапорець this.offLine
   * @param {async function} funcItem - функція яку потрібно виконати
   * @param {*} params - параметри що передаються до функції funcItem(params)
   * @returns
   */
  async iteration(funcItem, params) {
    let trace = 0,
      ln =
        this.ln +
        `iteration(${funcItem.name},${params.regName}${
          params.value || params.value === 0 ? "=" + params.value : ""
        })::`;
    trace ? log("i", ln, `Started`) : null;
    // очікуємо відкриття порту, якщо він ще не відкритий
    await this.testPortOpened();
    // очікуємо, якщо наразі виконується поточний запит
    // тобто закінчення попередньої операції
    let i = 0,
      period = this.period.if.deviceBusy; // лічильник повторів, період між запитами
    while (this.busy) {
      log(
        "",
        ln,
        `Device ${this.header.ua} are busy.Trying N:${i}. Waiting: ${period}s`
      );
      i++;
      await dummyPromise(period * 1000);
    }

    // встановлюємо ознаку транзакції
    this.busy = true;

    let res,
      resString = "";
    // скидаємо лічильник
    i = 0;
    // ознака успішності операції
    let ok = false;
    do {
      try {
        // перед кожною транзакцією перевіряємо стан порту, так як за
        // час, що пройшов від останнього запиту, порт може стати закритим
        await this.testPortOpened();
        // даємо запит на запис
        res = await funcItem(params);
        // все пройшло успішно
        ok = true;
      } catch (error) {
        // трапилась помилка
        if (trace) {
          log("i", ln, `error=`);
          console.dir(error);
        }
        //log("e", ln, "err=", error.messages.en);
        let period = this.period.if.timeOut * (this.offLine ? 2 : 1);
        // лічимо помилки
        if (!this.offLine) this.errorCounter.value += 1;
        if (this.errorCounter.value > this.errorCounter.max) {
          this.errorCounter.value = this.errorCounter.max;
          this.offLine = true;
          log("w", ln + "Device offline!");
        }

        log(
          "",
          ln +
            `errCounter=${this.errorCounter.value}.Try again.. ${i} after ${period}s`
        );
        i++;
        await dummyPromise(period * 1000);
      }
    } while (!ok);
    this.busy = false;
    this.errorCounter.value = 0;
    this.offLine = false;
    trace ? log("i", ln + "Iteration completed") : null;
    return res;
  } //async iteration

  /** Функція записує 1 регістр в фізичний прилад
   * @param {String} regName - назва регістру, така як визначена в this.driver
   * @param {Number} value - значення регістру
   */
  async setRegister(regName, value) {
    let trace = 1,
      ln = this.ln + `setRegister(${regName}=${value})::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.regs[regName];
    // перевіряємо імя регустру
    if (!reg) {
      throw new Error(ln + "regs[regName] is undefined!");
    }
    let res;
    // даємо запит на запис
    res = await this.iteration(this.driver.setRegPromise, {
      iface: this.iface,
      id: this.addr,
      regName: regName,
      value: value,
    });
    // оновлюємо дані в state
    trace ? log("i", ln, `res=`, res) : null;
    reg.value = res.value;
    return `${regName}=${res.value}; `;
  } //async setRegister(regName, value)

  /** Функція повертає значення 1 регістра якщо ще не застарів - то поточне значення з regs, інакше з приладу
   * @param {String} regName - назва регістру, така як визначена в this.driver
   * @param {Number} value - значення регістру
   */
  async getRegister(regName) {
    let trace = 0,
      ln = this.ln + `getRegister("${regName}")::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.regs[regName];
    // перевіряємо імя регустру
    if (!reg) {
      throw new Error(ln + `regs[${regName}] is undefined!`);
    }
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    // перевіряємо чи актуальні дані
    if (reg.isActual()) {
      // повертаємо актуальні дані
      trace
        ? log("i", ln, `${regName} = ${reg.value}`, " - from memory")
        : null;
      return reg.value;
    }
    // поточне значення застаріло - даємо запит на запис
    let res = await this.iteration(this.driver.getRegPromise, {
      iface: this.iface,
      id: this.addr,
      regName: regName,
    });
    // оновлюємо дані в state
    trace ? log("i", ln, `res=`, res) : null;
    reg.value = res[0].value;
    return reg.value;
  } //async setRegister(regName, value)

  /**
   * Повертає html з компактним поданням пристрою
   * @param {Oblject} req - об'єкт запиту html
   * @returns
   */
  getCompactHtml(req) {
    return pug.render(`p ${this.ln}getCompactHtml(): Not defined yet`);
  }

  /**
   * Повертає html з розширеним поданням пристрою
   * @param {Oblject} req - об'єкт запиту html
   * @returns
   */
  getFullHtml(req) {
    return this.getCompactHtml(req);
  }
}; // class
