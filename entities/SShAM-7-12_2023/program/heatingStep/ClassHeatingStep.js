const log = require("../../../../tools/log.js");
let ClassThermoStep = require("../classStep/ClassThermoStep.js");

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
   *
   * @property {Number} props.wave.period=30 - сек, період між опитуванням поточної температури
   * @property {Number} props.wave.dT=0.1 - *С, рахується що настала вершина хвилі, коли середня похідна менше цього значення
   * @property {Number} props.wave.points=10, кількість точок для розрахунку середньої похідної
   */

  constructor(props) {
    let trace = 1;
    trace ? log("i", "HeatingStep.constructor()::", `props=`, props) : null;
    super(props);

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

    //період опитування в мс, для диференціації часу опитування в залежності від стадії кроку
    let period = this.periodCheckT * 1000;

    // якщо процесс в стані зупинки, помилки, кінця - виходимо
    if (
      this.state == "stoped" ||
      this.state == "finished" ||
      this.state == "error"
    ) {
      return this.state;
    }

    // якщо стан процесу:очікування, плануємо свій запуск пізніше та виходимо
    if (this.state == "waiting") {
      setTimeout(() => this.testProcess(), period * 2);
      return;
    }

    // відмітка часу
    this.currTime = (new Date().getTime() - this.startTime) / 1000;

    // запит температури
    let t = null;
    try {
      // if (trace) {
      //   log("i", ln, `this=`);
      //   console.dir(this);
      // }
      // запит температури
      t = await this.getT();
      trace ? log("", ln, `t=${t}C; Process time: ${this.currTime}s`) : null;

      // якщо під-крок нагрівання - перевіряємо умови інакше витримка
      if (this.heating) {
        this.checkHeating(t);
      } else {
        this.checkWave(t);
        period = this.wave.period * 1000;
      }
    } catch (error) {
      this.logger("e", `Error when try execute function this.getT`);
      console.dir(error);
      this.error(error);
      // на випадок помилки зв'язку не викидаємо помилку, а очікуємо відновлення
      // return;
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
      this.finish({
        ua: `Нагрівання завершено`,
        en: `Heating finished`,
        ru: `Нагрев завершен`,
      });
    }
  }

  checkHeating(t) {
    if (this.errT.max && t > this.taskT + this.errT.max) {
      this.error({
        ua: `Перевищена температура!`,
        en: `Hight temperature!`,
        ru: `Высокая температура!`,
      });
      return;
    }

    if (t >= this.taskT) {
      // температура досягнута, кінець
      this.logger(
        "w",
        "Цільова температура досягнута! Очікуємо стабілізації. "
      );
      this.heating = false;
      this.wave.beforeT = t;
      return 1;
    }

    if (this.errH != 0) {
      // якщо помилка розігрівання не дорівнює 0

      if (this.currTime > (this.H + this.errH) * 60) {
        // якщо час сплив
        this.error({
          ua: `Перевищено час нагрівання !!!`,
          en: `Heating time is over !!!`,
          ru: `Превышено время разогрева !!!`,
        });
        return;
      }
    }
  }
}

module.exports = ClassHeatingStep;
