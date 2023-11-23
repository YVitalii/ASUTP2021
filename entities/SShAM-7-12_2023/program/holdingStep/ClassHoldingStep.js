const log = require("../../../../tools/log.js");
let ClassThermoStep = require("../classStep/ClassThermoStep.js");

/**
 * Клас виконує крок "Витримка"
 */

class ClassHoldingStep extends ClassThermoStep {
  /**
   * Конструктор
   * @param {*} props
   * @property {Number} props.title=undefined  - опис кроку
   * @property {Number} props.taskT - *С, задана температура
   * @property {Object} props.errT={min:-25,max:25} - *C, помилка температури; 0 = не контролювати
   * @property {Number} props.Y=0- хв, час нагрівання; 0 = максимально швидко
   * @property {Number} props.periodCheckT=5- сек, період між опитуваннями поточної температури
   * @property {async Function} props.getT - функція запиту поточної температури
   *
   */

  constructor(props) {
    super(props);
    // хв, тривалість витримки, якщо 0 = до отримання команди "Стоп"
    this.ln = this.ln + "HoldingStep()::";
    this.Y = props.Y ? props.Y : 0;
    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: -25, max: +25 };
  }

  async start() {
    let trace = 1,
      ln = this.ln + "Start()::";

    this.startTime = new Date().getTime();
    this.testProcess();
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
    return await super.start();
  }

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess(" + new Date().toLocaleTimeString() + ")::";
    if (!(await super.testProcess())) {
      return 1;
    }

    if (this.errT.min && this.currT < this.taskT + this.errT.min) {
      this.error({
        ua: `Низька температура!`,
        en: `Low temperature!`,
        ru: `Низкая температура!`,
      });
      return 1;
    }

    if (this.errT.max && this.currT > this.taskT + this.errT.max) {
      this.error({
        ua: `Висока температура!`,
        en: `Hight temperature!`,
        ru: `Высокая температура!`,
      });
      return 1;
    }

    if (this.Y != 0) {
      trace
        ? log("0", ln, `Y = ${this.Y * 60}s; currTime=${this.processTime}s`)
        : null;
      if (this.processTime > this.Y * 60) {
        // якщо час сплив

        this.finish({
          ua: `Витримка завершена !!!`,
          en: `Holding  finished !!!`,
          ru: `Удержание завершено !!!`,
        });
        return 1;
      }
    }
    // запускаємо наступну перевірку
    setTimeout(() => this.testProcess(), this.periodCheckT);
  }
}

module.exports = ClassHoldingStep;
