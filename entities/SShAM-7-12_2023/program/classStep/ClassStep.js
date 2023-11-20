const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;

/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  constructor(props = {}) {
    let trace = 1;

    this.state = "waiting"; // поточний стан кроку, перелік можливих станів: ["waiting","going","finished","error"]
    this.err = null; // зберігає опис помилки
    /** Опис кроку, виводиться в полі програми */
    this.title = props.title
      ? props.title
      : { ua: `Невизначено`, en: `Undefined`, ru: `Неопределено` };

    this.ln = "ClassStep(" + this.title.ua + ")::";
    let ln = this.ln + "Constructor()::";

    trace ? log("i", ln, `props=`, props) : null;
    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();

    // сек, період опитування поточної температури, по замовчуванню кожні 5 сек
    this.periodCheckT = props.periodCheckT ? props.periodCheckT * 1000 : 5000;

    // асинхронна функція для отримання поточної температури
    if (typeof props.getT != "function") {
      throw new Error(
        "props.getT must be a function, but received: " + typeof props.getT
      );
    }
    this.getT = props.getT;

    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: -25, max: +25 };
  }

  logger(level, msg) {
    log(level, this.ln, "[", new Date().toLocaleTimeString() + "]::" + msg);
  }

  async start() {
    this.logger("w", "Received command  'Start'");
    this.state = "going";
    //this.promise = new Promise();

    return new Promise(async (resolve, reject) => {
      let test = this.testState();
      while (!test) {
        await dummy(2000);
        test = this.testState();
      }
      resolve(1);
    });
  }

  stop() {
    this.logger("w", "Received command 'Stop'");
    this.state = "finished";
  }

  finish() {
    this.logger("w", "Received command  finish !!");
    this.state = "finished";
  }

  error(err) {
    this.logger("e", "Happen an Error:" + err.ua);
    this.state = "error";
    this.err = err;
  }

  testState() {
    let trace = 0,
      ln = this.ln + "testState()::";
    trace ? log("i", ln, `this.state=`, this.state) : null;

    // якщо крок завершено повертаємо Успіх
    if (this.state == "finished") {
      trace ? log("i", ln, `Finished!!`) : null;
      return 1;
    }

    // якщо виникла помилка кидаємо помилку
    if (this.state == "error") {
      trace ? log("i", ln, `Error!!`) : null;
      throw new Error(this.err.ua);
    }

    return 0;
  }
}

module.exports = ClassStep;
