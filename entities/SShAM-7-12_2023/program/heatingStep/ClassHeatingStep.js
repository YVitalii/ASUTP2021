const { request } = require("express");
const log = require("../../../../tools/log.js");
let ClassThermoStep = require("../classStep/ClassThermoStep.js");
const pug = require("pug");

/**
 * Клас виконує крок "Нагрівання"
 */
class ClassHeatingStep extends ClassThermoStep {
  /**
   * Конструктор
   * @param {*} props
   * @property {Number} props.taskT - *С, задана температура
   * @property {Object} props.errT={min:undefined,max:100} - хв, помилка температури; undefined = не контролювати
   * @property {Number} props.H=0 - хв, час нагрівання; 0 = максимально швидко
   * @property {Number} props.errH=0 - хв, помилка часу нагрівання; 0 = не контролювати
   * @property {Number} props.periodCheckT=5 - сек, період між опитуваннями поточної температури
   * @property {async Function} props.getT - функція запиту поточної температури
   * @property {Object} props.wave - параметри пошуку точки перегину тренду температури
   * При 10 точках х 30 сек = 3 хв, тобто якщо за 3 хв. температура зросла менше ніж 10*0,1=1*С - рахуємо що стабілізація виконана
   * @property {Number} props.wave.period=30 - сек, період між опитуванням поточної температури.
   * @property {Number} props.wave.dT=0.1 - *С, рахується що настала вершина хвилі, коли середня похідна менше цього значення
   * @property {Number} props.wave.points=10, кількість точок для розрахунку середньої похідної
   */

  constructor(props) {
    let trace = 0;
    trace ? log("i", "HeatingStep.constructor()::", `props=`, props) : null;
    super(props);
    this.maxT = 750; //TODO додати в props автоматичне максимальну температуру
    this.ln = "ClassHeatingStep(" + this.title.ua + ")::";

    let ln = this.ln + "constructor()::";

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.H = props.H ? props.H : 0;

    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: undefined, max: +100 };

    // максимальний час запізнення нагрівання, після якого рахується помилка
    this.errH = props.errH ? props.errH : 0;

    // індикатор під-кроку процесу нагрівання, true - йде розігрів, false - йде очікування 1-ї хвилі
    this.heating = true;

    // налаштування для пошуку точки перегину тренду температури
    this.wave = {};
    props.wave = props.wave ? props.wave : {};
    this.wave.period = props.wave.period ? props.wave.period : 30;
    this.wave.dT = props.wave.dT ? props.wave.dT : 1;
    this.wave.points = props.wave.points ? props.wave.points : 10;
    this.wave.arr = []; // массив для зберігання останніх this.wave.points значень
    for (let i = 0; i < this.wave.points; i++) {
      this.wave.arr.push(10);
    }
    this.wave.pointer = 0; // курсор в масиві для вставлення нового значення
    this.wave.beforeT = 0; // попередня температура
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }

  async start() {
    this.startTime = new Date().getTime();
    this.heating = true;
    this.testProcess();
    return await super.start();
  }

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess(" + new Date().toLocaleTimeString() + ")::";
    // trace ? log("i", ln, `Started!!`) : null;
    if (!(await super.testProcess())) {
      return 1;
    }
    //період опитування в мс, для диференціації часу опитування в залежності від стадії кроку
    let period = this.periodCheckT * 1000;
    // якщо під-крок нагрівання - перевіряємо умови інакше витримка
    if (this.heating) {
      this.checkHeating(this.currT);
    } else {
      this.checkWave(this.currT);
      // змінюємо період опитування
      period = this.wave.period * 1000;
      // запамятовуємо час старту очікування хвилі
      this.wave.start = this.processTime;
    }
    // запускаємо наступну перевірку
    setTimeout(() => this.testProcess(), period);
  }

  checkWave(t) {
    let trace = 0,
      ln = this.ln + "checkWave(" + t + ")::";
    let dT = t - this.wave.beforeT;
    this.wave.beforeT = t;
    this.wave.arr[this.wave.pointer] = dT;
    this.wave.pointer += 1;
    if (this.wave.pointer >= this.wave.points) {
      this.wave.pointer = 0;
    }
    if (trace) {
      log("i", ln, `this.wave=`);
      console.dir(this.wave);
    }
    let sum = 0;
    for (let i = 0; i < this.wave.points; i++) {
      sum += this.wave.arr[i];
    }
    sum = sum / this.wave.points;
    trace ? log("i", ln, `sum=`, sum) : null;

    if (sum <= this.wave.dT) {
      let msg = `checkWave(); currT=${this.currT}*C; Duration = ${(
        this.processTime - this.wave.start
      ).toFixed(2)}m; average derivative=${sum.toFixed(2)}::`;

      this.finish({
        ua: `${msg}Нагрівання завершено`,
        en: `${msg}Heating finished`,
        ru: `${msg}Нагрев завершен`,
      });
      this.logger("checkWave()::${msg}::Stabilization finished!");
    }
  }

  checkHeating(t) {
    if (this.errT.max && t > this.taskT + this.errT.max) {
      let msg = `checkHeating(T=${this.currT}*C; Tmax = ${
        this.taskT + this.errT.max
      }*C)::`;
      this.error({
        ua: `${msg}Висока температура!`,
        en: `${msg}Hight temperature!`,
        ru: `${msg}Высокая температура!`,
      });
      return 1;
    }

    if (t >= this.taskT) {
      // температура досягнута, кінець
      let msg = `checkHeating(taskT=${this.taskT}*C; current T = ${this.currT}*C)::`;
      this.logger(
        "w",
        msg + "Цільова температура досягнута! Очікуємо стабілізації. "
      );
      this.heating = false;
      this.wave.beforeT = t;
      return 1;
    }

    if (this.errH != 0) {
      // якщо помилка розігрівання не дорівнює 0

      if (this.currTime > (this.H + this.errH) * 60) {
        // якщо час сплив
        let msg = `H=${this.H}m; error Heating:${this.errH}m; current duration: ${this.processTime}m::`;
        this.error({
          ua: `${msg}Перевищено час нагрівання !!!`,
          en: `${msg}Heating time is over !!!`,
          ru: `${msg}Превышено время разогрева !!!`,
        });
        return;
      }
    }
  }
  getRegs() {
    // {id:"",header:"",title:{ ua:`` , en: ``, ru: `` }, min:, max:,},
    let regs = [
      {
        id: "tT",
        type: "number",
        header: "T, &deg;C",
        title: {
          ua: `Задана температура, &deg;C`,
          en: `Task temperature, &deg;C`,
          ru: `Заданная температура, &deg;C`,
        },
        min: 20,
        max: this.maxT,
      },
      {
        id: "Н",
        type: "time",
        header: "Н",
        title: {
          ua: `Тривалість нагрівання, хв`,
          en: `Heating delay, min`,
          ru: `Длительность нагревания, мин`,
        },
        min: 0,
        max: 100,
      },
      {
        id: "errH",
        header: "errH",
        type: "time",
        title: {
          ua: `Тривалість витримки, хв`,
          en: `Holding delay, min`,
          ru: `Длительность выдержки, мин`,
        },
        min: 0,
        max: 120,
        default: 30,
      },
    ];
    return regs;
  }

  getHTML() {
    let html = pug.renderFile(__dirname + "/html.pug", {
      regs: this.getRegs(),
    });
    return html;
  }
}

module.exports = ClassHeatingStep;
