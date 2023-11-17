/**
 *
 */
let ClassStep = require("./classStep/ClassStep.js");

class ClassHeating extends ClassStep {
  constructor(props) {
    super({ title: { ua: `Розігрівання`, en: `Heating`, ru: `` } });

    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.H = props.H ? props.H : 0;

    // асинхронна функція для запуску програми на приладі
    if (typeof props.getT != "function") {
      throw new Error(
        "props.getT must be a function, but received: " + typeof props.getT
      );
    }
    this.getT = props.getT;

    // відмітка часу при старті програми
    this.startTime = null;

    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: undefined, max: +100 };
  }

  async start() {
    super.start();
    this.startTime = new Date();
    this.testState();
  }

  async testState() {
    let t = null;
    try {
      t = await this.getT();
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
        
    } catch (error) {
      this.error(error);
    }
    setTimeout(() => this.testState(), 5000);
  }
}
