/** Керує процесом */
const pug = require("pug");
const path = require("path");
const log = require("../../tools/log");
const normalizePath = require("path").normalize;
const dummy = require("../../tools/dummy.js").dummyPromise;

class ClassProcessManager {
  constructor(props = {}) {
    this.homeURL = props.homeURL ? props.homeURL + "/processManager" : "/";
    this.homeDir = normalizePath(
      props.homeDir ? props.homeDir + "processManager\\" : "/",
    );
    // this.moduleDir = __dirname;
    this.id = "processManager";
    this.header = {
      ua: `Менеджер процесу`,
      en: `Process manager`,
      ru: `Менеджер процессов`,
    };
    this.ln = props.ln ? props.ln : `ClassProcessManager(${this.homeURL})::`;
    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `Started with props=`);
      console.dir(props);
    }
    //    ------ tasksManager -----------
    if (!props.tasksManager) {
      throw new Error(this.ln + "TasksManager must be defined!! ");
    }
    this.tasksManager = props.tasksManager;

    //  -------- loggerManager ---------
    if (!props.loggerManager) {
      throw new Error(this.ln + "loggerManager must be defined!! ");
    }
    this.loggerManager = props.loggerManager;

    //  -------- loggerManager ---------
    if (!props.devicesManager) {
      throw new Error(this.ln + "devicesManager must be defined!! ");
    }
    this.devicesManager = props.devicesManager;

    //  -------- stepsManager ---------
    if (!props.stepsManager) {
      throw new Error(this.ln + "stepsManager must be defined!! ");
    }
    this.stepsManager = props.stepsManager;

    // ---------- afterAll() -----------
    //  функція, що виконується після завершення програми
    this.afterAll = props.afterAll ? props.afterAll : undefined;

    // поточна програма
    this.program = {};
    // программа
    //this.program = [];
    // програма з даними для браузера
    this.htmlProgram = {};
    this.htmlProgram.states = []; // програма для браузера
    this.htmlProgram.lastUpdate = 0; // відмітка часу останнього оновлення програми для браузера
    // програма в tasksManager уже завантажена синхронно
    this.setProgram();
    this.loggerManager.start();
  }

  setProgram() {
    // Список завдань фіксуємо на момент виклику: беремо копію з tasksManager
    // і віддаємо її stepsManager. Поки програма виконується, createProgram відмовляє.
    let trace = 0,
      ln = this.ln + " setProgram()::";
    let tasksList = this.tasksManager.getActiveTask().content;
    let result = this.stepsManager.createProgram(tasksList);
    if (!result || result.err) return result;

    this.listSteps = this.stepsManager.listSteps;
    this.currLogFileName = null;
    this.program = this.stepsManager.program;

    // --- по завершенню програми потрібно або зупинити всі прилади,
    // або виконати специфічні дії, що записані
    // в entity.js→process.afterAll()
    this.program.afterAll = async () => {
      let trace = 1,
        ln = this.ln + "afterAll()::";
      trace ? log("i", ln, `Started`) : null;
      // якщо є функція afterAll - викликаємо її
      if (this.afterAll && typeof this.afterAll == "function") {
        try {
          await this.afterAll();
          trace ? log("i", ln, `External afterAll() function executed`) : null;
        } catch (error) {
          log("e", ln + error.message);
        }
      }

      // зупиняємо запис лог-файлу через 15 хв по закінченню програми
      // якщо стан будь-який а не finished, то продовжуємо запис

      if (this.program.state._id == "finished") {
        let time = 15; // 15 хв
        this.currLogFileName = null;
        trace
          ? log(
              "i",
              ln,
              `Scheduled stoping write log file after ${time} minutes`,
            )
          : null;
        setTimeout(
          () => {
            this.loggerManager.start();
          },
          time * 60 * 1000,
        );
      }
    }; //this.program.afterAll
    // this.setTaskPoints(program[0]);

    trace = 0;
    if (trace) {
      log("", ln, `this.program.tasks[1]=`);
      console.dir(this.program.tasks[1], { depth: 4 }); //, { depth: 4 }
    }
    // парсимо програму для HTML
    this.getHtmlProgram();
    let data = {
      ua: `Програму "${this.listSteps[0].name}" успішно завантажено.`,
      en: `Program "${this.listSteps[0].name}" was set successfully.`,
      ru: `Программа "${this.listSteps[0].name}" успешно загружена.`,
    };
    trace = 0;
    if (trace) {
      log("", ln, `this.htmlProgram=`);
      console.dir(this.htmlProgram.states.tasks[1], { depth: 3 });
    }
    return { err: null, data };
  } // setProgram() {

  getStates() {
    let trace = 0,
      ln = this.ln + "getStates()::";
    let states = this.program.getStates();
    if (trace) {
      log("i", ln, `states=`);
      console.dir(states);
    }
    return states;
  }

  /**
   * Проходить по всім крокам програми та збирає інфо про їх стан
   * @returns повертає в браузер об'єкт зі станами кроків програми
   */
  getHtmlProgram() {
    let trace = 0,
      ln = this.ln + "getHtmlProgram()::";
    // перевіряємо час останнього оновлення програми
    let now = new Date().getTime();
    if (now - this.htmlProgram.lastUpdate > 10 * 1000) {
      // оновлювалась більше 10 сек назад, оновлюємо
      this.htmlProgram.states = this.program.getState(); //;
      this.htmlProgram.states.logFileName = this.loggerManager.fileName;
      this.htmlProgram.lastUpdate = new Date().getTime();
    }
    if (trace) {
      log("i", ln, `htmlProgram=`);
      console.dir(htmlProgram, { depth: 3 });
    }
    return this.htmlProgram.states;
  }

  /**
   * Рендерить pug шаблони та ініціює модуль
   * @param {Object} req - обєкт запиту
   * @returns
   */
  getFullHtml(req) {
    let trace = 0,
      ln = this.ln + "getFullHtml()::";

    let lang = req.user.lang ? req.user.lang : "ua";
    let template = path.resolve(__dirname + "/views/procMan_full.pug");
    trace ? log("i", ln, `template=`, template) : null;
    let html = pug.renderFile(template, { processMan: this });
    return html;
  }

  // async startStep(step) {
  //   if (Array.isArray(step)) {
  //     for (let i = 0; i < step.length; i++) {
  //       const el = step[i];
  //       await this.startStep(el);
  //     }
  //   }
  //   if (typeof step != "object" || typeof step.start != "function") {
  //     return;
  //   }
  //   this.state.activeTasks[step.id] = step;
  //   await step.this.start();
  //   this.state.activeTasks[step.id] = undefined;

  //   return;
  // }
  /**
   *  Генерує імя файлів логів   формуємо  у вигляді: "2024-04-05_16-31"
   *  від назви "05-04-2024t10-11" - відмовився не зручно сортуват
   */

  generateLogFileName() {
    let fileName = "",
      i = 0;
    let trace = 1,
      ln = this.ln + "generateLogFileName()::";
    do {
      let newFileN = new Date().toLocaleTimeString().slice(0, -3);
      //log(`newFileN=`, newFileN);
      newFileN = newFileN.replace(/\:/g, "-");
      newFileN = new Date().toISOString().split("T")[0] + "_" + newFileN;
      fileName = newFileN + (i == 0 ? "" : "-" + i);
      i++;
      trace
        ? log("i", ln, `New log file name generated: fileName=`, fileName)
        : null;
    } while (
      this.loggerManager.fileManager.exist(
        fileName + this.loggerManager._fileExtensions.logger,
      )
    );
    trace
      ? log(
          "i",
          ln,
          `New log file created: fileName=`,
          fileName + this.loggerManager._fileExtensions.logger,
        )
      : null;
    return fileName;
  }

  async start(stepN = 1) {
    let trace = 1,
      ln = this.ln + `Start(${stepN})::`;
    stepN = parseInt(stepN);
    if (isNaN(stepN)) {
      throw new Error("Invalid step number: " + stepN);
    }
    while (!this.program.state || !this.program.state._id) {
      await dummy(1000);
    }

    if (this.program.state._id == "going") {
      let err = {
        ua: `Програма вже "${this.program.header.ua}" виконується!`,
        en: `Program is already "${this.program.header.en}" running!`,
        ru: `Програма уже "${this.program.header.ru}" запущена!`,
      };
      log("e", ln + err.ua);
      return { err, data: null };
    }
    // якщо починаємо з кроку №1 - то програму запущено спочатку
    if (stepN == 1 || this.currLogFileName == null) {
      //очищуємо попередній стан кроків
      this.setProgram();
      //створюємо нове імя файлу
      this.currLogFileName = this.generateLogFileName();
    }

    await this.loggerManager.start(this.currLogFileName);
    this.program.start(stepN);

    //await this.loggerManager.start(fileName);

    let data = {
      ua: `Програма "${this.program.header.ua}" почала виконання!`,
      en: `Program is "${this.program.header.en}" started!`,
      ru: `Програма "${this.program.header.ru}" запущена!`,
    };
    this.listSteps[0].started = new Date().toISOString();
    await this.loggerManager.saveTasks(this.listSteps);
    return { err: null, data };
  }

  stop() {
    console.log("--------------- stop() --------------------");
    // let ln = this.ln + "stop()::";
    // trace ? log("i", ln, `Started!`) : null;
    if (this.program.state && this.program.state._id == "going") {
      this.program.stop();
      return;
    }

    // for (let i = stepN; i < this.program.length; i++) {
    //   const element = this.program[i];
    // }
  }

  getCompactHtml(req) {
    return this.getFullHtml(req);
  }
}

module.exports = ClassProcessManager;
