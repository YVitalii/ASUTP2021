const log = require("../../../../tools/log.js");
let ClassStep = require("../classStep/ClassStep.js");

/**
 * Клас виконує крок "Нагрівання"
 */
class ClassHoldingStep extends ClassStep {
  /**
   * Конструктор
   * @param {*} props
   * @property {Number} props.title=undefined  - опис кроку
   * @property {Number} props.taskT - *С, задана температура
   * @property {Object} props.errT={min:-25,max:25} - хв, помилка температури; undefined = не контролювати
   * @property {Number} props.Y=0 - хв, час нагрівання; 0 = максимально швидко
   * @property {Number} props.periodCheckT=5 - сек, період між опитуваннями поточної температури
   *
   */

  constructor(props) {
    super(props);
    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.Y = props.Y ? props.Y : 0;
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
      trace ? log("i", ln, `t=`, t) : null;
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

    if (this.Y != 0) {
      // якщо помилка розігрівання не дорівнює 0
      let currTime = (new Date().getTime() - this.startTime) / 1000;
      trace ? log("i", ln, `Process time= `, parseInt(currTime), " s") : null;

      if (currTime > this.Y * 60) {
        // якщо час сплив
        this.finish({
          ua: `Витримка завершена !!!`,
          en: `Holding  finished !!!`,
          ru: `Удержание завершено !!!`,
        });
        return;
      }
    }
  }
}

module.exports = ClassHoldingStep;
