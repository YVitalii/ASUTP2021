/** Модуль експортує батьківський клас що містить загальні властивості + методи для всіх менеджерів приладів */

const log = require("../../tools/log.js");
const { dummyPromise } = require("../../tools/dummy.js");
let test = require("../../config.js").test;
const ClassDeviceRegGeneral = require("./ClassDevManagerRegGeneral.js");
const ClassGeneral = require("../../ClassGeneral.js");
const pug = require("pug");

module.exports = class ClassDevManagerGeneral extends ClassGeneral {
  /**
   * Конструктор
   * @param {Object} props - додаткові налаштування конкретного приладу
   * @param {Object} props.iface - об'єкт інтерфейсу до якого підключено цей прилад, повинен мати функцію send()
   * @param {Integer} props.addr - адреса приладу в iface
   * @param {Object} props.driver - драйвер приладу
   * @param {Object} props.period.if - визначає затримки між запитами для різних ситуацій
   * @param {Integer} props.period.if.portNotOpened=5 - якщо порт не відкрито
   * @param {Integer} props.period.if.timeOut=5 - якщо прилад не відповідає
   * @param {Integer} props.period.if.error=10 - помилка
   * @param {Integer} props.period.if.deviceBusy=2 - прилад зайнятий
   */

  constructor(props) {
    super(props);

    let trace = 1,
      ln = "constructor::";

    // ----------- iface -------------
    if (!props.iface || typeof props.iface.send != "function") {
      throw new Error(
        ln +
          `"iface" for the device must be defined and must has the function "send"!`
      );
    }
    this.iface = props.iface;

    // ----------- addr -------------
    if (typeof props.addr == "undefined" || props.addr == null) {
      throw new Error(
        ln +
          `Address of the device must be defined! but: addr="${props.addr}" !`
      );
    }
    this.addr = props.addr;
    // settings for tracing
    let addr = "" + this.addr;
    addr = addr.length > 10 ? ".." + addr.slice(-10) : addr;
    this.ln += `[${this.addr}]::`;
    ln = this.ln + ln;

    // ----------- driver -------------
    if (!props.driver || typeof props.driver.getRegPromise != "function") {
      throw new Error(
        ln +
          `"driver" for the device must be defined and must has the function "getRegPromise"!`
      );
    }
    this.driver = props.driver;

    // опис регістрів приладу кожний регістр - сутність типу ClassDevManagerRegGeneral
    this.regs = {};

    // ----------- періоди затримки -------------
    this.period = {};
    // якщо режим тестування, зменшуємо тайминги в 2 рази = 1/2=0,5
    let k = test ? 0.5 : 1;
    let p = {};
    if (props.period && props.period.if) {
      p = props.period.if;
    }

    this.period.if = {
      //seconds
      portNotOpened: k * (p.portNotOpened ? p.portNotOpened : 5),
      timeOut: p.timeOut ? p.timeOut : 2,
      error: k * (p.error ? p.error : 10),
      deviceBusy: k * (p.deviceBusy ? p.deviceBusy : 2),
    };
    // поточне значення
    this.period.value = this.period.if.portNotOpened;

    // -------- лічильник помилок -----------
    /**
     * @property лічильник помилок
     * @prop {Number} value - поточне значення лічильника
     * @prop {Number} max - максимальне значення лічильника
     */
    this.errorCounter = {
      value: 0, //поточне значення
      max: test ? 3 : 10, //максимальне значення
    };

    /** ознака відсутності звязку з приладом */
    this.offLine = false;
  } // constructor

  /**
   * Функція запуску приладу.
   * @param {*} regs
   */
  async start(regs = {}) {
    log("w", "start()::", "Not defined yet");
  }

  /**
   * Функція зупинки приладу.
   *
   * @async
   * @param {{}} [regs={}]
   * @returns {Promise}
   */
  async stop(regs = {}) {
    log("w", "stop()::", "Not defined yet");
  }

  /**
   * Додає регістр до regs
   * @param {Object | Array of Objects} reg - налаштування потрібні для створення екземпляру ClassDeviceRegGeneral
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
    trace ? log("i", ln, `Started`) : null;
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }

    if (this.regs[reg.id] != undefined) {
      throw new Error(
        ln + `Dublicate reg.id="${reg.id}"! This id already was defined!`
      );
    }

    if (!this.driver.has(reg.id)) {
      if (!this.driver.has(reg.driverRegName)) {
        throw new Error(
          ln + `reg.id="${reg.id}" not defined in the device driver`
        );
      }
    }

    let newReg = new ClassDeviceRegGeneral(reg);
    this.regs[newReg.id] = newReg;
    if (trace) {
      log("i", ln, `Was added the newReg=`);
      console.dir(newReg);
    }
  }

  /**
   * Перетворює список регістрів в масив та перевіряє наявність таких регістрів в менеджері
   * @param {Array | String } regsList - масив з id регістрів або рядок з сепаратором ";" Наприклад: ["T1","T2","WrongRegName"] or "T1;T2;WrongRegName"
   * @returns {Array} ["T1","T2"]
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
        // key;

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
          // ставимо в чергу запит на зчитування поточного значення регістра
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
    trace ? log("i", ln, `Started. Wait port opening`) : null;
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
    trace ? log("i", ln, `Device not busy. Start transaction.`) : null;

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
        let trace = 0;
        // трапилась помилка
        if (trace) {
          log("w", ln, `error=`);
          console.dir(error);
        }
        //log("e", ln, "err=", error.messages.en);
        let period = this.period.if.timeOut * (this.offLine ? 2 : 1);
        // лічимо помилки
        if (!this.offLine) this.errorCounter.value += 1;
        if (this.errorCounter.value >= this.errorCounter.max) {
          // з приладом немає зв'язку
          this.errorCounter.value = this.errorCounter.max;
          this.offLine = true;
          log("e", ln + "Device offline!");
          return { value: null, note: "Device offline!" };
        }

        trace
          ? log(
              "",
              ln +
                `errCounter=${this.errorCounter.value}. offLine=${this.offLine}. Try again.. ${i} after ${period}s`
            )
          : null;
        i++;
        // очікуємо період
        await dummyPromise(period * 1000);
      }
    } while (!ok);
    // знімаємо ознаку зайнятості
    this.busy = false;
    // скидаємо лічильник помилок
    this.errorCounter.value = 0;
    // скидаємо ознаку, що прилад відсутній в мережі
    this.offLine = false;
    //якщо трасуваання - виводимо результат в лог
    trace ? log("i", ln + "Iteration completed") : null;
    // повертаємо результат
    return res;
  } //async iteration

  /** Функція записує 1 регістр в фізичний прилад
   * @param {String} regName - назва регістру, така як визначена в this.driver
   * @param {Number} value - значення регістру
   */
  async setRegister(regName, value) {
    let trace = 0,
      ln = this.ln + `setRegister(${regName}=${value})::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.regs[regName];
    // перевіряємо імя регістру
    if (!reg) {
      throw new Error(ln + "regs[regName] is undefined!");
    }
    let res;
    // даємо запит на запис
    res = await this.iteration(this.driver.setRegPromise.bind(this.driver), {
      iface: this.iface,
      id: this.addr,
      regName: reg.driverRegName,
      value: value,
    });
    // оновлюємо дані в state
    trace ? log("i", ln, `res=`, res) : null;
    reg.value = res.value;
    return `${regName}=${res.value}; `;
  } //async setRegister(regName, value)

  async getParams(params) {
    return this.getRegsValues(params);
  }

  getAddT() {
    return 0;
  }
  /** Функція повертає значення 1 регістра якщо ще не застарів - то поточне значення з regs, інакше з приладу
   * @param {String} regName - назва регістру, така як визначена в this.driver
   * @param {Number} value - значення регістру або null, якщо актуальних даних немає
   */
  async getRegister(regName) {
    let trace = 0,
      ln = this.ln + `getRegister("${regName}")::`;
    trace ? log("i", ln, `Started`) : null;
    let reg = this.regs[regName];
    // перевіряємо імя регістру
    if (!reg) {
      throw new Error(ln + `regs[${regName}] is undefined!`);
    }
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    // якщо прилад відсутній в мережі
    if (this.offLine) {
      // якщо прилад відсутній в мережі
      trace ? log("i", ln, `Device is offline!`) : null;
      return null;
    }
    // перевіряємо чи актуальні дані
    if (reg.isActual()) {
      // повертаємо актуальні дані
      trace
        ? log("i", ln, `${regName} = ${reg.value}`, " - from memory")
        : null;
      return reg.value;
    }
    // поточне значення застаріло - даємо запит на читання
    let res = await this.iteration(
      this.driver.getRegPromise.bind(this.driver),
      {
        iface: this.iface,
        devAddr: this.addr,
        regName: reg.driverRegName,
      }
    );
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
    return pug.render(`p ${this.ln}getFullHtml(): Not defined yet`);
  }
}; // class
