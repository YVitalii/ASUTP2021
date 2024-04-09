/** Керує процесом */
const pug = require("pug");
const path = require("path");
const log = require("../../tools/log");

class ClassProcessManager {
  constructor(props = {}) {
    this.homeUrl = props.homeUrl ? props.homeUrl + "processManager/" : "/";
    this.homeDir = props.homeDir ? props.homeDir + "processManager\\" : "/";
    // this.moduleDir = __dirname;

    this.id = "processManager";
    this.header = {
      ua: `Менеджер процесу`,
      en: `Process manager`,
      ru: `Менеджер процессов`,
    };
    this.ln = props.ln ? props.ln : `ClassProcessManager(${this.homeUrl})::`;
    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `Started with props=`);
      console.dir(props);
    }
    if (!props.tasksManager) {
      throw new Error(this.ln + "TasksManager must be defined!! ");
    }
    this.tasksManager = props.tasksManager;
    // поточний стан процессу
    this.state = {};
    // індикатор виконання завдань
    this.state.isRunning = false;
    // список поточних кроків
    this.state.activeSteps = {};
    // программа
    this.program = [];
  }
  /**
   *
   */
  setStep(prefix, arr, list) {
    let trace = 1,
      ln = this.ln + "setStep()::";
    trace
      ? log(
          "i",
          ln,
          `Started with: prefix=`,
          prefix,
          ";  list=",
          JSON.stringify(list)
        )
      : null;
    // if (trace) {
    //   log("i", ln, `list=`);
    //   console.dir(list);
    // }
    if (Array.isArray(list)) {
      let newArr = [];
      for (let j = 0; j < list.length; j++) {
        let newPrefix = prefix + `:${j}`;
        const item = list[j];
        this.setStep(newPrefix, newArr, item);
      }
      arr.push(newArr);
    } //if (Array.isArray(list))
    // if (trace) {
    //   log("i", ln, `this.tasksManager.getType(list.id)=`);
    //   console.dir(this.tasksManager.getType(list.id));
    // }
    // let constructor = this.tasksManager.getType(list.id).getStep;
    // // if (trace) {
    // //   log("i", ln, `constructor=`);
    // //   console.dir(constructor);
    // // }
    // if (!constructor) {
    //   throw new Error(`Type "${list.id}" not defined!!`);
    // }
    if (!list.id) {
      return;
    }
    let props = { ...list };
    props.id = prefix;
    let step = this.tasksManager.getType(list.id).getStep(props);
    // if (trace) {
    //   log("i", ln, `step=`);
    //   console.dir(step);
    // }
    arr.push(step);
    //return arr;
  } //setStep()

  setProgram() {
    // --беремо готову прогаму з tasksManager--
    // готову програму брати неможна, так як іншмй користувач може її змінити,
    // а нам потрібно зафіксувати момент "Пуск" і виконувати останню програму
    //  тому парсимо кроки тут.
    //  TODO Перенести в процесМенеджер список доступних кроків з tasksManager
    // в tasksManager брати список звідси
    let trace = 1,
      ln = this.ln + "";
    this.listSteps = this.tasksManager.list;
    this.program = [];
    this.setStep("st", this.program, this.listSteps);
    this.program = this.program[0];
  } // setProgram() {

  getFullHtml(req) {
    let trace = 1,
      ln = this.ln + "getFullHtml()::";
    // if (trace) {
    //   log("i", ln, `Started with props=`);
    //   console.dir(props);
    // }

    let lang = req.user.lang ? req.user.lang : "ua";
    let template = path.resolve(__dirname + "/views/procMan_full.pug");
    trace ? log("i", ln, `template=`, template) : null;
    let html = pug.renderFile(template, { processMan: this });
    return html;
  }

  async startStep(step) {
    if (Array.isArray(step)) {
      for (let i = 0; i < step.length; i++) {
        const el = step[i];
        await this.startStep(el);
      }
    }
    if (typeof step != "object" || typeof step.start != "function") {
      return;
    }
    this.state.activeTasks[step.id] = step;
    await step.this.start();
    this.state.activeTasks[step.id] = undefined;

    return;
  }

  start(stepN = 1) {
    stepN = parseInt(stepN);
    if (isNaN(stepN)) {
      throw new Error("Invalid step number");
    }
    this.startStep(this.program[step]);
    // for (let i = stepN; i < this.program.length; i++) {
    //   const element = this.program[i];
    // }
  }

  getCompactHtml(req) {
    return this.getFullHtml(req);
  }
}

module.exports = ClassProcessManager;
