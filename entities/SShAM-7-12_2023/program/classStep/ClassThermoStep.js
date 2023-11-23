const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;
const ClassStep = require("./ClassStep.js");
/** Загальний клас кроку термічної програми, оcновна логіка та основні параметри */
class ClassThermoStep extends ClassStep {
  /**
   * Конструктор класу, оптимізованого під нагрівання
   * @param {*} props
   * @property {}
   */
  constructor(props = {}) {
    super(props);
    let trace = 1;

    let ln = this.ln + "Constructor()::";

    trace ? log("i", ln, `props=`, props) : null;
    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();
    // поточна тривалість процесу
    this.processTime = 0;
    // поточна температура процесу
    this.currT = undefined;
    // сек, період опитування поточної температури, по замовчуванню кожні 2 сек
    this.periodCheckT = props.periodCheckT ? props.periodCheckT : 2;

    // асинхронна функція для отримання поточної температури
    if (typeof props.getT != "function") {
      throw new Error(
        "props.getT must be a function, but received: " + typeof props.getT
      );
    }
    this.getT = props.getT;

    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: -25, max: +25 };
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } // constructor

  logger(level, msg) {
    log(level, this.ln, "[", new Date().toLocaleTimeString() + "]::" + msg);
  }
  /**
   *
   * @returns true - якщо перевіряти далі, false - якщо процес завершено
   */
  async testProcess() {
    let trace = 1,
      ln =
        "ClassThermoStep()::testProcess(" +
        new Date().toLocaleTimeString() +
        ")::";
    // якщо процесс в стані: очікування, зупинки, помилки, кінця - виходимо
    if (
      this.state._id == "stoped" ||
      this.state._id == "finished" ||
      this.state._id == "error"
    ) {
      return false;
    }
    if (this.state._id == "waiting") return true;
    // оновлюємо поточну тривалість процесу
    this.processTime = (new Date().getTime() - this.startTime) / 1000;

    try {
      // запит температури
      this.currT = await this.getT();
      trace
        ? log("", ln, `t=${this.currT}°C; Process time:${this.processTime}s`)
        : null;
    } catch (error) {
      this.logger(
        "e",
        ln + `Error when try execute function this.getT():` + error.message
      );
      console.dir(error);
      return true;
      // на випадок помилки зв'язку не викидаємо помилку, а очікуємо відновлення
    }
    return true;
  } //async testProcess()
}

module.exports = ClassThermoStep;
