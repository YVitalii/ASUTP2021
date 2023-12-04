const { request } = require("express");
const log = require("../../../../tools/log.js");
const toTimeString = require("../../../../tools/general.js").toTimeString;
let ClassThermoStep = require("../classStep/ClassThermoStep.js");
const pug = require("pug");

/**
 * Клас виконує крок "Нагрівання"
 */
class ClassHeatingStep extends ClassThermoStep {
  /**
   * Конструктор
   * @param {*} props
   * @property {Number} props.tT - *С, задана температура
   * @property {Object} props.errT={min:0, max:50} - хв, помилка температури; undefined = не контролювати
   * @property {Number} props.H=0 - хв, час нагрівання; 0 = максимально швидко
   * @property {Number} props.errH=0 - хв, помилка часу нагрівання; 0 = не контролювати
   * @property {Number} props.periodCheckT=5 - сек, період між опитуваннями поточної температури
   * @property {async Function} props.getT - async функція запиту поточної температури
   * @property {async Function} props.wT=0 - *С; 0= вимкнено; закид першої хвилі перерегулювання
   * @property {Object} props.wave - параметри пошуку точки перегину графіку температури
   * При 10 точках х 30 сек = 3 хв, тобто якщо за 3 хв. температура зросла менше ніж 10*0,1=1*С - рахуємо що стабілізація виконана
   * @property {Number} props.wave.period=30 - сек, період між опитуванням поточної температури.
   * @property {Number} props.wave.dT=0.1 - *С, рахується що настала вершина хвилі, коли середня похідна менше цього значення
   * @property {Number} props.wave.points=10, кількість точок для розрахунку середньої похідної
   */

  constructor(props) {
    let trace = 0;
    trace ? log("i", "HeatingStep.constructor()::", `props=`, props) : null;
    super(props);

    //this.maxT = 750; //TODO додати в props автоматичне максимальну температуру

    this.ln = "ClassHeatingStep(" + this.title.ua + ")::";

    let ln = this.ln + "constructor()::";

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.regs.H = {
      id: "Н",
      type: "time",
      header: "Н",
      value: props.H ? props.H : 0,
      title: {
        ua: `Тривалість нагрівання, хв`,
        en: `Heating delay, minute`,
        ru: `Длительность нагревания, мин`,
      },
      min: 0,
      max: 99 * 60 + 59 - 10,
    };

    // максимальний час запізнення нагрівання, після якого рахується помилка
    this.regs.errH = {
      id: "errH",
      header: "errH",
      type: "number",
      value: props.errH ? props.errH : 0,
      title: {
        ua: `Помилка тривалості нагрівання (0=вимкнути), хв`,
        en: `Error of heating duration (0=disable), minute`,
        ru: `Ошибка длительности времени нагревания (0=отключить), мин`,
      },
      min: 0,
      max: 120,
      default: 30,
    };

    // температура першої хвилі перерегулювання, слугує для прийняття рішення про пропуск/очікування етапу першої хвилі
    this.regs.wT = {
      id: "firstWave_T",
      header: "wT",
      type: "number",
      value: props.wT ? props.wT : 0,
      title: {
        ua: `Перерегулювання першої хвилі (0=вимкнути), °С`,
        en: `Overheating for first wave (0=disable), °С`,
        ru: `Перерегулирование первой волны (0=отключить), °С`,
      },
      min: 0,
      max: 200,
      default: 10,
    };

    // індикатор під-кроку процесу нагрівання, true - йде розігрів, false - йде очікування 1-ї хвилі
    this.heating = true;

    // налаштування для пошуку точки перегину тренду температури
    this.wave = {};
    props.wave = props.wave ? props.wave : {};
    this.wave.period = props.wave.period ? props.wave.period : 30;
    this.wave.dT = props.wave.dT ? props.wave.dT : 0.1;
    this.wave.points = props.wave.points ? props.wave.points : 10;
    this.wave.arr = []; // массив для зберігання останніх this.wave.points значень
    // заповнюємо масив 2-ками
    for (let i = 0; i < this.wave.points; i++) {
      this.wave.arr.push(2);
    }

    // курсор в масиві для вставлення нового значення
    this.wave.pointer = 0;

    // попередня температура
    this.wave.beforeT = 0;

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
    let trace = 0,
      ln = this.ln + "testProcess(" + new Date().toLocaleTimeString() + ")::";
    trace ? log("i", ln, `Started!!`) : null;

    if (!(await super.testProcess())) {
      return 1;
    }

    //період опитування в мс, для диференціації часу опитування в залежності від стадії кроку
    let period = this.periodCheckT * 1000;
    // якщо під-крок нагрівання - перевіряємо умови інакше витримка
    if (this.heating) {
      this.checkHeating(this.currT);
    } else {
      if (this.regs.wT.value == 0) {
        // якщо очікування хвилі вимкнено → фініш
        this.logger("w", ln, "Очікування хвилі вимкнуто (wT=0).");
        this.finish("wT=0::");
        return;
      }
      // інакше очікуємо вершину хвилі
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
      this.logger(`checkWave()::${msg}::Stabilization finished!`);
      this.finish(msg);
    }
  }

  finish(msg) {
    super.finish({
      ua: `${msg}Нагрівання завершено`,
      en: `${msg}Heating finished`,
      ru: `${msg}Нагрев завершен`,
    });
  }

  checkHeating(t) {
    let trace = 1,
      ln = this.ln + `checkHeating(${t})::`;
    trace ? log("i", ln, `Started`) : null;
    // перевищення температури
    if (this.regs.errTmax && t > this.regs.tT.value + this.regs.errTmax) {
      let msg = `checkHeating(T=${this.currT}*C; Tmax = ${
        this.regs.tT.value + this.regs.errTmax
      }*C)::`;
      this.error({
        ua: `${msg} Висока температура!`,
        en: `${msg} Hight temperature!`,
        ru: `${msg} Высокая температура!`,
      });
      return 1;
    }
    //
    let limT = this.regs.tT.value + this.regs.errTmin.value * 0.5;
    trace ? log("i", ln, `limT=`, limT) : null;
    if (t >= limT) {
      // температура досягнута, кінець
      let msg = `checkHeating(taskT+(errTmin*0.5))=${this.regs.tT.value} + 0.5*${this.regs.errTmin}=${limT}*C; currentT = ${this.currT}*C)::`;
      this.logger("w", msg + "Цільова температура досягнута!  ");
      this.heating = false;
      this.wave.beforeT = t;
      return 1;
    }

    if (this.regs.errH.value != 0) {
      // якщо помилка розігрівання не дорівнює 0

      if (this.currTime > (this.regs.H.value + this.regs.errH.value) * 60) {
        // якщо час сплив
        let msg = `H=${this.regs.H.value}m; error Heating:${this.regs.errH.value}m; current duration: ${this.processTime}m::`;
        this.error({
          ua: `${msg}Перевищено час нагрівання !!!`,
          en: `${msg}Heating time is over !!!`,
          ru: `${msg}Превышено время разогрева !!!`,
        });
        return 1;
      }
    }
  }
  getRegs() {
    return regs;
  }

  getHTML(step_id) {
    let html = pug.renderFile(__dirname + "/html.pug", {
      regs: this.getRegs(),
      step_id: step_id,
    });
    return html;
  }
}
ClassHeatingStep.getTaskHtml = () => {
  return "Список параметрів";
};
module.exports = ClassHeatingStep;
