// ------------ логгер  --------------------

const log = require("../../tools/log.js"); // логер
const ThermStep = require("./ThermStep.js");
const syncFileWorker = require("../../tools/syncFileWorker.js");
const fs = require("fs");
// модуль з описом співвідношень полів
const programTransform = require("./programTransform.js");

const dummy = require("../../tools/dummy").dummyPromise; // асинхронна заглушка

/** клас, що відповідає за виконання всієї програми
 *
 */

class ThermProcess {
  #RUN_MODE_PERIOD = 15 * 1000; //період опитування приладів в режимі ПУСК (кожні ?? сек)
  #STOP_MODE_PERIOD = 30 * 1000; //період опитування приладів в режимі СТОП (кожні ?? сек)
  /**
   *
   * @param {Array of DeviceManager} devices - масив налаштованих об'єктів менеджерів приладів, що беруть участь в управлінні нагрівачами  (див. приклад /devices/trp08/manager.js)
   *
   *
   */
  constructor(devices, props = {}) {
    let trace = 1;
    let ln = "ThermProcess()::";
    this.ln = ln;
    if (trace) {
      log(ln, "devices=");
      console.dir(devices);
    }
    // перевіряємо валідність devices
    if (Array.isArray(devices) && devices.length == 0) {
      let error = new Error("Аргумент devices має бути масивом приладів.");
      log("e", err, ": ", devices);
      throw err;
    }
    this.devices = devices;
    // тут зберігається програма
    this.program = [];
    this.homeDir = props.homeDir;
    this.lastProgram = this.homeDir + "lastProgram.txt"; // файл з останньою завантаженою програмою
    //this.lastState = this.homeDir + "lastState.txt"; // файл з записом поточного стану
    // тут зберігається поточний стан процессу
    this.state = {
      tasks: [], // поточні завдання, що видані приладам
      go: [], // функціїї запуску кожної задачі на виконання для Promise.all()
      stop: true,
      note: "Очікування. Програма не завантажена.",
      startTime: null, // початок виконання процесу
      step: 0, // поточний крок
      timestamp: new Date(), // момент останньої зміни стану
    };

    // завантажуємо останню програму
    {
      let trace = 0;
      let prg = syncFileWorker.load(this.lastProgram);
      if (trace) {
        log("i", this.ln, `prg=`);
        console.dir(prg);
      }

      if (Array.isArray(prg)) {
        this.program = prg;
        log("i", this.ln, `Остання програма "${prg[0].title}" завантажена `);
        if (trace) {
          log("i", this.ln, `this.program=`);
          console.dir(this.program);
        }
      }
    }
  } // constructor

  /** завантажує програму в процесс
   * опис дивись в модулі ./programTransform.js
   * @return true - у випадку удачі, false -  ні
   * */
  setProgram(arr) {
    let trace = 0,
      ln = this.ln + "setProgram()::";
    if (trace) {
      log("i", ln, "arr=");
      console.dir(arr);
    }

    this.program = programTransform(arr);

    if (trace) {
      log("i", ln, "this.program=");
      console.dir(this.program);
    }

    this.state.stop = true;
    this.state.currStep = 0;
    this.state.programStartTime = new Date();
    this.state.tasks = [];
    this.state.go = [];
    this.state.note = `Програму ${
      this.program[0].title
    } завантажено о ${this.state.programStartTime.toLocaleTimeString()}`;
    log("w", ln, this.state.note);
    syncFileWorker.save(this.lastProgram, this.program); //запамятовуємо останню програму
    //syncFileWorker.del(this.lastState); // очищуємо запис стану - бо нова програма
    return 1;
  }

  /**
   * Запускає крок на виконання
   * @param {Number} step - номер кроку з якого починати програму
   *
   */
  async start(step = 1) {
    let trace = 1,
      ln = this.ln + "start()::";
    log("w", ln, "<------------", " from step=", step, "------------>");
    // якщо программа вже запущена  - повертаємо помилку
    if (!this.state.stop) {
      let err =
        "Виконується програма! Спочатку потрібно зупинити виконання поточної програми!";
      log("e", ln + err);
      return Promise.reject(new Error(err));
    }

    // вимикаємо режим СТОП
    this.state.stop = false;
    // запамятовуємо стартовий крок
    step = parseInt(step);
    // бо у нас під номером 0 - йде опис програми
    step = step == 0 ? 1 : step;
    this.state.currStep = step;
    trace
      ? log("i", ln, "this.program[", step, "]=", this.program[step])
      : null;

    // запамятовуємо момент запуску програми
    this.state.programStartTime = new Date();

    // змінюємо період опитування в режим "Робота"
    this.period = this.#RUN_MODE_PERIOD;

    //trace ? console.log(ln, "this.state=", this.state) : null;

    // послідовно проходимо всі кроки програми
    for (let step = this.state.currStep; step < this.program.length; step++) {
      // поточний крок (для скорочення коду)
      let curStep = this.program[step];
      // запамятовуємо поточний крок
      this.state.note = curStep.note; // опис кроку
      this.state.currStep = step; // номер кроку
      this.state.timestamp = new Date(); // час початку кроку

      // очищуємо список завдань та термічних кроків
      this.state.go = []; // список функцій для Promise.all()
      this.state.tasks = []; // список термічних кроків
      //syncFileWorker.save(this.lastState, this.state); // зберігаємо поточний стан процесу
      // якщо під час виконання виник сигнал зупинки - виходимо
      if (this.state.stop) {
        break;
      }

      // якщо така функція є, запускаємо beforeStep
      if (this.beforeStep) {
        await this.beforeStep(curStep);
      }

      trace ? log("i", ln, `this.state=`, this.state) : null;

      // для всіх приладів створюємо термічні кроки з завданням для виконання
      for (let i = 0; i < this.devices.length; i++) {
        // створюємо ТермічніКроки для всіх приладів
        this.state.tasks.push(new ThermStep(this.devices[i], curStep));
        // складаємо список завдань для всіх приладів
        this.state.go.push(this.state.tasks[i].go());
      } // for (let id = 0;

      // if (trace) {
      //   log("i", ln, `this.state.tasks=`);
      //   console.dir(this.state.tasks);
      // }

      // запускаємо всі завдання на виконання, та очікуємо їх завершення
      try {
        await Promise.all(this.state.go);
      } catch (error) {
        // обробляємо помилку, якщо вона є
        this.state.note = error.msg;
        this.stop();
        log("e", ln, "Виконання процесу завершилося помилкою!");
        //return Promise.reject(error);
      }

      // якщо така функція є, запускаємо afterStep
      if (this.afterStep) {
        await this.afterStep(curStep);
      } else {
        trace ? log("n", ln, `afterStep() not found`) : null;
      }
    } //for (let step
    //
  }

  async beforeStep() {
    let trace = 1,
      ln = this.ln + "beforeStep()";
    trace ? log("i", ln, `Empty. Started`) : null;
    await dummy();
    trace ? log("i", ln, `Empty. Finished`) : null;
  }

  async stop() {
    let ln = this.ln + "stop()::";
    this.state.stop = true;
    this.state.timestamp = new Date();
    this.state.note =
      "Програма зупинена: " + this.state.timestamp.toLocaleString();
    // зупиняє виконання термічних кроків
    for (let i = 0; i < this.state.tasks.length; i++) {
      this.state.tasks[i].stop();
    }
    //syncFileWorker.del(this.lastState);
    log("w", ln, this.state.note);
  }

  getProgram() {
    return this.program;
  }

  getState() {
    let state = this.copyInfoFromObj(this.state, [
      "stop",
      "note",
      "programStartTime",
      "currStep",
      "timestamp",
    ]);
    return state;
  }

  copyInfoFromObj(source, arr = []) {
    let res = {};
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i];
      res[el] = source[el] !== undefined ? source[el] : null;
    }
    return res;
  }
} //class ThermProcess

module.exports = ThermProcess;
