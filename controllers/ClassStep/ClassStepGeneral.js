const log = require("../../tools/log.js");
const dummy = require("../../tools/dummy.js").dummyPromise;

/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  /**
   *
   * @param {*} props
   * @property {String} props.id= - ідентифікатор кроку
   * @property {Object} props.header={ua,en,ru} - тут зберігається заголовок кроку
   * @property {Object} props.comment={} - тут зберігається опис кроку
   * @property {async function} props.beforeStart={} - функція, що викликається перед початком кроку
   * @property {async function} props.afterAll={} - функція, що викликається після закінчення кроку
   */
  constructor(props = {}) {
    let trace = 0;

    //тут зберігаються основні налаштування
    //this.regs = {};
    this.id = props.id
      ? props.id
      : "id_" + new Date().getTime().toString().slice(-6);
    // тут зберігається стан кроку
    this.state = {};
    // поточний стан кроку,
    // перелік можливих станів: "waiting","going","finished","stoped","error"
    this.state._id = "waiting";
    this.state.note = { ua: `Очікування`, en: `Waiting`, ru: `Ожидание` };
    this.state.startTime = undefined;
    this.state.duration = "0"; // тривалість виконання кроку в вигляді "ГГ:ХХ:СС"
    // зберігає опис помилки
    this.err = null;
    // тривалість виконання кроку в секундах
    this.currentDuration = 0;

    // дата останньої зміни стану кроку
    this.state.changed = undefined;
    this.setChanged(); // відразу відмічаємо момент створення кроку

    /** Опис кроку, виводиться в полі програми */
    this.header = props.header
      ? props.header
      : { ua: `Крок ${this.id}`, en: `Step ${this.id}`, ru: `Шаг ${this.id}` };
    this.comment = props.comment ? props.comment : { ua: ``, en: ``, ru: `` };
    // на 2024-05-02 не використовується, залишена для сумісності з нащадками
    // TODO видалити цю змінну
    // stepPoints=[] масив точок, що використовуються для відображення задачі на графіку
    // {dTime, value, valMin, valMax}
    //  dTime - хв, тривалість кроку (різниця часу між початком кроку та його завершенням) або undefined= очікувати завершення
    //  value - значення величини яке потрібно досягти по закінченню часу dTime
    //  valMin, valMax - коридор нормальних значень
    this.stepPoints = [];

    this.ln = props.ln ? props.ln : "ClassStep(" + this.header.ua + ")::";
    let ln = this.ln + "Constructor()::";
    trace ? log("i", ln, `props=`, props) : null;

    // асинхронна функція для виконання перед початком кроку (підготовка)
    this.beforeStart = props.beforeStart
      ? props.beforeStart
      : async (regs = {}) => {
          //log("", ln, "beforeStart()::Not defined. Return 1.");
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
      : async (regs = {}) => {
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
    let now = new Date();
    let { header, comment } = this;
    let point = {
      comment: {
        ua: `${header.ua}::${comment.ua}::${msg.ua ? msg.ua : msg}`,
        en: `${header.en}::${comment.en}::${msg.en ? msg.en : msg}`,
        ru: `${header.ru}::${comment.ru}::${msg.ru ? msg.ru : msg}`,
      },
    };

    log(
      level,
      this.ln,
      "[",
      now.toLocaleTimeString() + "]::" + `${msg.en ? msg.en : msg}`
    );
  }

  async start() {
    let trace = 1,
      ln = "start()::";
    this.logger("w", ln + "Received command  'Start'");
    // стан виконання
    this.state._id = "going";
    // скидаємо стан кроку
    this.state.startTime = new Date();
    this.state.duration = "0"; // тривалість виконання кроку в вигляді "ГГ:ХХ:СС"
    this.err = null; // зберігає опис помилки
    this.currentDuration = 0; // тривалість виконання кроку в секундах
    //  початкові налаштування
    try {
      await this.beforeStart();
      this.logger("i", ln + "beforeStart()::Completed.");
    } catch (error) {
      this.error(error);
      return;
    }

    let msg = this.state.startTime.toLocaleString();
    this.state.note = {
      ua: `Початок о ${msg}`,
      en: `Started at ${msg}`,
      ru: `Старт в ${msg}`,
    };
    this.logger("w", ln + this.state.note.ua);

    this.setChanged();

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
      this.state.endTime = new Date();
      this.setChanged();
      // if (this.state._id == "error") {
      //   reject(this.err);
      // }
      resolve(1);
    });
  }

  stop(msg) {
    let ln = "stop()::";
    if (this.state._id != "going") {
      this.logger(
        "e",
        ln +
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
    this.logger("w", ln + "Received command stop()::" + msg.en);
    this.state._id = "stoped";
    this.state.note = msg;
    this.setChanged();
  }

  /** Повертає поточну тривалість кроку
   * @return с
   */
  duration() {
    let now = new Date();
    let dur = now.getTime() - this.state.startTime.getTime();
    this.currentDuration = dur / 1000;
    this.state.duration = new Date(dur).toISOString().slice(11, -5);
    return dur;
  }

  finish(msg = {}) {
    let ln = "finish()::";
    if (this.state._id != "going") {
      this.logger(
        "e",
        ln +
          `Received command finish() but step has state= ${this.state._id}. Command ignored!`
      );
      return;
    }
    this.duration();
    let duration = this.state.duration;
    msg =
      msg && msg.ua
        ? msg
        : {
            ua: `Крок успішно завершено! Тривалість: ${duration}`,
            en: `Step successfully finished! Duration: ${duration}`,
            ru: `Шаг успешно завершен! Длительность: ${duration}`,
          };

    this.logger("i", ln + "Received command finish()::" + msg.en);
    this.state._id = "finished";
    this.state.note = msg;
    this.setChanged();
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
    this.setChanged();
  }

  testState() {
    let trace = 0,
      ln = "testState()::";
    trace ? log("", ln, `this.state._id=`, this.state._id) : null;
    this.duration();
    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "finished") {
      trace ? log("", ln + `Finished!!`) : null;
      return 1;
    }

    // якщо крок завершено повертаємо Успіх
    if (this.state._id == "stoped") {
      trace ? log("", ln + `Stoped!!`) : null;
      return 1;
    }

    // якщо виникла помилка кидаємо помилку
    if (this.state._id == "error") {
      trace ? log("e", ln + `Error!!`) : null;
      //this.afterAll();
      return 1;
      //throw new Error(this.err.ua);
    }

    return 0;
  }

  getState() {
    let res = { ...this.state };
    res.id = this.id;
    res.header = this.header;
    res.comment = this.comment;
    return res;
  }
  /**
   * додає часову відмітку останньої зміни стану
   */
  setChanged() {
    this.state.changed = new Date();
  }
}

module.exports = ClassStep;
