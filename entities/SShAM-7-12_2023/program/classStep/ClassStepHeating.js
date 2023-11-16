let Step = require("./ClassStep.js");
const log = require("../../../../tools/log");

class ClassHeating extends Step {
  constructor(props = {}) {
    super(props);
    let trace = 1,
      ln = this.ln + "constructor()::";
    trace ? log("i", ln, `Started`) : null;
    // заголовок для логування
    this.ln = "ClassHeating(" + this.title.ua + ")";
    // асинхронна функція для запису програми в прилад
    if (typeof props.deviceSetParams != "function") {
      throw new Error(
        "props.deviceSetParams must be a function, but received: " +
          props.deviceSetParams
      );
    }
    this.deviceSetParams = props.deviceSetParams;
    // асинхронна функція для запиту поточної температури
    if (typeof props.getT != "function") {
      throw new Error(
        "props.getT must be a function, but received: " + props.getT
      );
    }

    this.getT = props.getT;

    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();
    // максимальне відхилення температури від розрахункової
    this.limits = props.limits ? props.limits : null;
    // час розігрівання, якщо не вказано = 0 → максимально швидко
    this.time = props.time ? props.time : 0;

    // асинхронна функція для запуску програми на приладі
    if (typeof props.deviceStart != "function") {
      throw new Error(
        "props.deviceStart must be a function, but received: " +
          typeof props.deviceStart
      );
    }
    this.deviceStart = props.deviceStart;

    // асинхронна функція для зупинки програми на приладі
    if (typeof props.deviceStop != "function") {
      throw new Error(
        "props.deviceStop musope a function, but received: " +
          typeof props.deviceStop
      );
    }
    this.deviceStop = props.deviceStop;
  }
}
module.exports = ClassHeating;
