const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;
const ClassStep = require("./ClassStep.js");
/** Загальний клас кроку термічної програми, оcновна логіка та основні параметри */
class ClassThermoStep extends ClassStep {
  constructor(props = {}) {
    super(props);
    let trace = 1;

    this.ln = "ClassThermStep(" + this.title.ua + ")::";
    let ln = this.ln + "Constructor()::";

    trace ? log("i", ln, `props=`, props) : null;
    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();

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

  // async start() {
  //   return await super.start();
  // }
}

module.exports = ClassThermoStep;
