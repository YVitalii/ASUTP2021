const log = require("../../tools/log");
const { dummyPromise } = require("../../tools/dummy.js");
const test = require("../../config.js").test;

module.exports = class ClassDeviceManagerGeneral {
  /**
   * Конструктор
   * @param {Object} props - додаткові налаштування конкретного приладу
   * @param {Object} props.iface - об'єкт до якого підключено цей прилад
   * @param {Integer} props.addr - адреса приладу в iface
   * @param {Integer} props.driver - драйвер приладу
   * @param {Integer} props.id - ідентифікатор приладу в deviceManager
   * @param {Number} props.header={ua,en..} - назва приладу
   */
  constructor(props) {
    this.ln = props.ln ? props.ln : "ClassDeviceManagerGeneral::";
    let trace = 1,
      ln = this.ln + "constructor::";
    // ----------- id -------------
    if (!props.id) {
      throw new Error(ln + `"id" of the device must be defined!`);
    }
    this.id = props.id;
    // ----------- id -------------
    if (!props.addr) {
      throw new Error(ln + `"addr" of the device must be defined!`);
    }
    this.addr = props.addr;
    // ----------- iface -------------
    if (!props.iface && typeof props.iface.send == "function") {
      throw new Error(
        ln +
          `"iface" for the device must be defined and must has the function "send"!`
      );
    }
    this.iface = props.iface;
    // ----------- driver -------------
    if (!props.driver && typeof props.driver.getRegPromise == "function") {
      throw new Error(
        ln +
          `"driver" for the device must be defined and must has the function "getRegPromise"!`
      );
    }
    this.driver = props.driver;
    //
    // опис регістрів приладу має бути
    this.regs = props.regs ? props.regs : {};
    // назва приладу для відображення
    if (!props.header || !props.header.en) {
      throw new Error(ln + `"header.en" for the device must be defined!`);
    }
    this.header = props.header;
    // ----------- періоди затримки -------------
    this.period = {};
    this.period.if = {
      //s
      portNotOpened: test ? 1 : 5,
      timeOut: test ? 1 : 5,
      error: test ? 1 : 10,
      deviceBusy: test ? 1 : 5,
    };
    // поточне значення
    this.period.value = this.period.if.portNotOpened;
    // лічильник помилок
    this.errorCounter = {
      value: 0, //поточне значення
      max: 10, //максимальне значення
    };
    // ознака відсутності звязку з приладом, щоб не посилати
    this.offLine = true;
  } // constructor

  /**
   * Повертає список поточного стану всіх регістрів приладів
   */
  getState() {
    return this.regs;
  }

  /**
   * Очікує поки порт не відкриється
   */
  async testPortOpened() {
    let trace = 1,
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

  /**
   * Виконує запит по фізичному інтерфейсу, якщо інтерфейс ще не відкритий
   * - очікує його відкриття, посилає запит → встановлює прапорець this.busy →
   * після  відповіді/помилки
   * @param {async function} funcItem - функція яку потрібно виконати
   * @param {*} params - параметри що передаються до функції funcItem(params)
   * @returns
   */
  async iteration(funcItem, params) {
    let trace = 1,
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
        let period = this.period.if.timeOut;
        // лічимо помилки
        this.errorCounter.value += 1;
        if (this.errorCounter.value >= this.errorCounter.max) {
          this.errorCounter.value = this.errorCounter.max;
          this.offLine = true;
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
    resolve(res);
  } //async iteration

  /** Функція записує 1 параметр
   * @param {String} regName - назва регістру, така як визначена в this.driver
   * @param {Number} value - значення регістру
   */
  async setRegister(regName, value) {
    let trace = 1,
      ln = this.ln + `setRegister(${regName}=${value})::`;
    trace ? log("i", ln, `Started`) : null;

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

    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    return `${regName}=${reg.value}; `;
  } //async setRegister(regName, value)

  /**
   * Оновлює дані в this.regs[regName]
   * @param {*} regName - назва регістру як в this.regs
   * @param {Object} res -  об'єкт, що містить поля {value,timestamp}
   */
  #refreshRegister(regName, res = {}) {
    let reg = this.regs[regName];
    reg.value = res.value;
    reg.timestamp = res.timestamp;
  }
};
