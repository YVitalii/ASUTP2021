const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;

/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  constructor(props = {}) {
    let trace = 0;

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
    this.periodCheckT = props.periodCheckT ? props.periodCheckT * 1000 : 2000;

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

  async beforeStart() {
    this.logger("w", "beforeStart()::Started");
    return 1;
  }
  async afterAll() {
    this.logger("w", "afterAll()::Started");
    return 1;
  }

  async start() {
    this.logger("w", "start()::Received command  'Start'");
    this.state = "going";
    try {
      await this.beforeStart();
      this.logger("w", "beforeStart()::Completed.");
    } catch (error) {
      this.error(error);
    }

    //this.promise = new Promise();

    return new Promise(async (resolve, reject) => {
      let test = this.testState();
      while (!test) {
        //log("test=", test);
        await dummy(2000);
        test = this.testState();
      }
      try {
        await this.afterAll();
        this.logger("w", "afterAll()::Completed.");
      } catch (error) {
        this.logger("w", "Error executing afterAll()");
        throw new Error("Error executing afterAll() ");
      }
      resolve(1);
    });
  }

  stop() {
    let note = msg.en ? msg.en : "undefined";
    this.logger("w", "stop()::Received command 'Stop'");
    this.currNote = msg;
    this.state = "stoped";
  }

  finish(msg) {
    let note = msg.en ? msg.en : "undefined";
    this.logger("w", "finish()::Received command  finish !!::" + note);
    this.state = "finished";
    this.currNote = msg;
  }

  error(err) {
    this.logger("e", "error(err)::Happen an Error:" + err.ua);
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

    // якщо крок завершено повертаємо Успіх
    if (this.state == "stoped") {
      trace ? log("i", ln, `Stoped!!`) : null;
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
