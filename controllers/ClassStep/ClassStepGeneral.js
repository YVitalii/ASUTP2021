const log = require("../../tools/log.js");
const dummy = require("../../tools/dummy.js").dummyPromise;

/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  /**
   *
   * @param {*} props
   * @property {Object} props.header={ua,en,ru} - тут зберігається заголовок кроку
   * @property {Object} props.comment={} - тут зберігається опис кроку
   * @property {async function} props.beforeStart={} - функція, що викликається перед початком кроку
   * @property {async function} props.afterAll={} - функція, що викликається після закінчення кроку
   */
  constructor(props = {}) {
    let trace = 0;

    //тут зберігаються основні налаштування
    this.regs = {};

    // тут зберігається стан кроку
    this.state = {};
    // поточний стан кроку,
    // перелік можливих станів: "waiting","going","finished","stoped","error"
    this.state._id = "waiting";
    this.state.note = { ua: `Очікування`, en: `Waiting`, ru: `Ожидание` };
    this.startTime = undefined;
    // зберігає опис помилки
    this.err = null;

    /** Опис кроку, виводиться в полі програми */
    this.header = props.header
      ? props.header
      : { ua: `Невизначено`, en: `Undefined`, ru: `Неопределено` };
    this.comment = props.comment ? props.comment : { ua: ``, en: ``, ru: `` };

    this.ln = "ClassStep(" + this.header.ua + ")::";
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

    try {
      await this.beforeStart();
      this.logger("i", "beforeStart()::Completed.");
    } catch (error) {
      this.error(error);
    }

    this.state._id = "going";
    this.state.startTime = new Date();
    //this.state.finishTime = undefined;
    let msg = this.state.startTime.toLocaleString();
    this.state.note = {
      ua: `Початок о ${msg}`,
      en: `Started at ${msg}`,
      ru: `Старт в ${msg}`,
    };
    this.logger("w", this.state.note.ua);
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
        this.logger("i", "afterAll()::Completed.");
      } catch (error) {
        this.logger("e", "Error executing afterAll()");
        throw new Error("Error executing afterAll() ");
      }
      resolve(1);
    });
  }

  stop(msg) {
    if (this.state._id != "going") {
      this.logger(
        "e",
        `Received command stop() but step has state= ${this.state._id}. Command ignored!`
      );
      return;
    }
    let duration = new Date(this.duration()).toISOString().slice(11, -2);
    msg =
      msg && msg.ua
        ? msg
        : {
            ua: `Крок зупинено! Тривалість: ${duration}`,
            en: `Step was stoped! Duration: ${duration}`,
            ru: `Шаг остановлен! Длительность: ${duration}`,
          };
    this.logger("w", "Received command stop()::" + msg.en);
    this.state._id = "stoped";
    this.state.note = msg;
  }

  /** Повертає поточну тривалість кроку
   * @return мс
   */
  duration() {
    let now = new Date();
    let dur = now.getTime() - this.state.startTime.getTime();
    return dur;
  }

  finish(msg = {}) {
    if (this.state._id != "going") {
      this.logger(
        "e",
        `Received command finish() but step has state= ${this.state._id}. Command ignored!`
      );
      return;
    }
    let duration = new Date(this.duration()).toISOString().slice(11, -2);
    msg =
      msg && msg.ua
        ? msg
        : {
            ua: `Крок успішно завершено! Тривалість: ${duration}`,
            en: `Step successfully finished! Duration: ${duration}`,
            ru: `Шаг успешно завершен! Длительность: ${duration}`,
          };

    this.logger("i", "Received command finish()::" + msg.en);
    this.state._id = "finished";
    this.state.note = msg;
    // this.currNote = msg;
  }

  error(err) {
    err =
      err || err.ua
        ? err
        : {
            ua: `Сталася помилка!`,
            en: `Happen en error!`,
            ru: `Случилась ошибка!`,
          };

    this.logger("e", "Received command error(err)::" + err.ua);
    this.state._id = "error";
    this.state.note = err;
    this.err = err;
  }

  testState() {
    let trace = 0,
      ln = this.ln + "testState()::";
    trace ? log("", ln, `this.state._id=`, this.state._id) : null;

    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "finished") {
      trace ? log("", ln, `Finished!!`) : null;
      return 1;
    }

    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "stoped") {
      trace ? log("", ln, `Stoped!!`) : null;
      return 1;
    }

    // якщо виникла помилка кидаємо помилку
    if (this.state._id == "error") {
      trace ? log("e", ln, `Error!!`) : null;
      this.afterAll();
      throw new Error(this.err.ua);
    }

    return 0;
  }
}

ClassStep.regs = {};

module.exports = ClassStep;
