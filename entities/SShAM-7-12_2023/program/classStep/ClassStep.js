const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;

/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  constructor(props = {}) {
    let trace = 0;
    this.state = {};
    // поточний стан кроку,
    // перелік можливих станів: "waiting","going","finished","stoped","error"
    this.state._id = "waiting";
    this.err = null; // зберігає опис помилки
    /** Опис кроку, виводиться в полі програми */
    this.title = props.title
      ? props.title
      : { ua: `Невизначено`, en: `Undefined`, ru: `Неопределено` };

    this.ln = "ClassStep(" + this.title.ua + ")::";
    let ln = this.ln + "Constructor()::";

    trace ? log("i", ln, `props=`, props) : null;

    // асинхронна функція для виконання перед початком кроку (підготовка)
    this.beforeStart = props.beforeStart
      ? props.beforeStart
      : async () => {
          return 1;
        };
    if (typeof this.beforeStart != "function") {
      throw new Error(
        "props.beforeStart must be a function, but received: " +
          typeof props.beforeStart
      );
    }

    // асинхронна функція для виконання в кінці процесу (завершення)
    this.afterAll = props.afterAll
      ? props.afterAll
      : async () => {
          return 1;
        };
    if (typeof this.afterAll != "function") {
      throw new Error(
        "props.afterAll must be a function, but received: " +
          typeof props.afterAll
      );
    }
  } // constructor

  logger(level, msg) {
    log(level, this.ln, "[", new Date().toLocaleTimeString() + "]::" + msg);
  }

  async start() {
    this.logger("w", "start()::Received command  'Start'");
    this.state._id = "going";
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
    this.logger("w", "stop()::" + note);
    this.currNote = msg;
    this.state._id = "stoped";
  }

  finish(msg) {
    let note = msg.en ? msg.en : "undefined";
    this.logger("w", "finish()::" + note);
    this.state._id = "finished";
    this.currNote = msg;
  }

  error(err) {
    this.logger("e", "error(err)::" + err.ua);
    this.state._id = "error";
    this.err = err;
  }

  testState() {
    let trace = 0,
      ln = this.ln + "testState()::";
    trace ? log("i", ln, `this.state._id=`, this.state._id) : null;

    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "finished") {
      trace ? log("i", ln, `Finished!!`) : null;
      return 1;
    }

    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "stoped") {
      trace ? log("i", ln, `Stoped!!`) : null;
      return 1;
    }

    // якщо виникла помилка кидаємо помилку
    if (this.state._id == "error") {
      trace ? log("i", ln, `Error!!`) : null;
      throw new Error(this.err.ua);
    }

    return 0;
  }
}

module.exports = ClassStep;
