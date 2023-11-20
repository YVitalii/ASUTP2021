const log = require("../../../../tools/log.js");
let ClassStep = require("../classStep/ClassStep.js");

/**
 * Клас виконує крок "Нагрівання"
 */
class ClassHeatingStep extends ClassStep {
  /**
   * Конструктор
   * @param {*} props
   * @property {Number} props.taskT - *С, задана температура
   * @property {Object} props.errT={min:undefined,max:100} - хв, помилка температури; undefined = не контролювати
   * @property {Number} props.H=0 - хв, час нагрівання; 0 = максимально швидко
   * @property {Number} props.errH=0 - хв, помилка часу нагрівання; 0 = не контролювати
   * @property {Number} props.periodCheckT=5 - сек, період між опитуваннями поточної температури
   * @property {async Function} props.getT - функція запиту поточної температури
   *
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
  }

  async start() {
    this.startTime = new Date().getTime();
    this.testProcess();
    return await super.start();
  }

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess(" + new Date().toLocaleTimeString() + ")::";
    // trace ? log("i", ln, `Started!!`) : null;
    let t = null;

    try {
      t = await this.getT();
      trace ? log("", ln, `t=`, t) : null;
    } catch (error) {
      this.error(error);
      return;
    }

    if (this.taskT.min && t < this.taskT.min) {
      this.error({
        ua: `Низька температура!`,
        en: `Low temperature!`,
        ru: `Низкая температура!`,
      });
      return;
    }

    if (this.taskT.max && t > this.taskT.max) {
      this.error({
        ua: `Висока температура!`,
        en: `Hight temperature!`,
        ru: `Высокая температура!`,
      });
      return;
    }

    if (t >= this.taskT) {
      // температура досягнута, кінець
      this.logger("w", "Цільова температура досягнута!");
      this.finish();
      return 1;
    }

    if (this.errH != 0) {
      // якщо помилка розігрівання не дорівнює 0
      let currTime = (new Date().getTime() - this.startTime) / 1000;
      trace ? log("", ln, `Process time= `, parseInt(currTime), " s") : null;

      if (currTime > (this.H + this.errH) * 60) {
        // якщо час сплив
        this.error({
          ua: `Перевищено час нагрівання !!!`,
          en: `Heating time is over !!!`,
          ru: `Превышено время разогрева !!!`,
        });
        return;
      }
    }

    setTimeout(() => this.testProcess(), this.periodCheckT);
  }
}

module.exports = ClassHeatingStep;
