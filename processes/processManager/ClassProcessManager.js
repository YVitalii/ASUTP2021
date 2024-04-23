/** Керує процесом */
const pug = require("pug");
const path = require("path");
const log = require("../../tools/log");
const clone = require("clone");
const ClassStepsSerial = require("../../controllers/ClassStep/ClassStepsSerial");

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
    if (!props.loggerManager) {
      throw new Error(this.ln + "loggerManager must be defined!! ");
    }
    this.loggerManager = props.loggerManager;
    // поточна програма
    this.program = {};
    // программа
    //this.program = [];
    // програма з даними для браузера
    this.htmlProgram = {};
    this.htmlProgram.states = []; // програма для браузера
    this.htmlProgram.lastUpdate = 0; // відмітка часу останнього оновлення програми для браузера
    // парсимо поточну програму 3 сек - щоб встиг завантажитися tasksManager
    setTimeout(() => this.setProgram(), 3000);
  }

  /**
   * рекурсивна функція, що парсить крок(и)
   */
  setStep(prefix, arr, list) {
    let trace = 0,
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
      // list - масив
      // створюємо внутрішній масив
      let newArr = [];
      for (let j = 0; j < list.length; j++) {
        let newPrefix = prefix + `_${j}`;
        const item = list[j];
        // викликаємо самі себе для кожного елементу масиву
        this.setStep(newPrefix, newArr, item);
      }
      // після обходу всіх потомків, отриманий внутрішній масив додаємо до батьківського
      arr.push(newArr);
    }
    if (!list.id) {
      // якщо елемент не має поля id - вихід
      return;
    }
    // копіюємо елемент в props
    let props = { ...list };
    props.id = prefix;
    // створюємо крок
    let step = this.tasksManager.getType(list.id).getStep(props);
    // if (trace) {
    //   log("i", ln, `step=`);
    //   console.dir(step);
    // }
    // додаємо крок до масиву
    arr.push(step);
  } //setStep()

  setProgram() {
    // --беремо готову прогаму з tasksManager--
    // готову програму брати неможна, так як іншмй користувач може її змінити,
    // а нам потрібно зафіксувати момент "Пуск" і виконувати останню програму
    //  тому робимо копію списку завдань та парсимо кроки тут.
    //  TODO Перенести в процесМенеджер список доступних кроків з tasksManager
    // в tasksManager брати список звідси
    let trace = 0,
      ln = this.ln + " setProgram()::";
    if (this.program.state && this.program.state._id == "going") {
      // -------- програма на виконанні, неможливо її змінити --------
      let err = {
        ua: `Не можна завантажити нову програму, в режимі виконання поточної`,
        en: `Can't set new tasks while the program is running`,
        ru: `Нельзя загрузить новую програму во время выполнения текущей `,
      };
      return { err, data: null };
    }

    //копіюємо поточний список завдань
    this.listSteps = clone(this.tasksManager.list);
    trace = 0;
    if (trace) {
      log("i", ln, `this.listSteps=`);
      console.dir(this.listSteps);
    }
    trace = 1;
    // очищуємо програму
    let program = [];
    // створюємо кроки
    // запускаємо рекурсивну функцію-генератор кроків
    this.setStep("st", program, this.listSteps);
    // оскільки функція видає масив масивів, беремо перший елемент
    // це милиця але поки немає часу розбиратися
    this.program = new ClassStepsSerial({
      id: this.id + ".program::",
      header: {
        ua: `${this.listSteps[0].name}`,
        en: `${this.listSteps[0].name}`,
        ru: `${this.listSteps[0].name}`,
      },
      comment: {
        ua: `Активна програма`,
        en: `Active program`,
        ru: `Активная программа`,
      },
      ln: this.ln,
      tasks: program[0],
    });

    // this.setTaskPoints(program[0]);

    trace = 1;
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

  /**
   *
   * @param {String} prefix - префікс кроку
   * @param {Object | Array} item  - під-крок для парсингу
   * @param {Array} result - результат парсингу
   * @returns
   */
  getStep(prefix, item, result = []) {
    let trace = 0,
      ln = this.ln + "getStep()::";
    if (Array.isArray(item)) {
      let newArr = [];
      for (let index = 0; index < item.length; index++) {
        const element = this.getStep(prefix + "_" + index, item[index], newArr);
        if (element) {
          newArr.push(newArr);
        }
      } // for
      result.push(newArr);
    } else {
      if (!item.id) {
        return;
      }
      if (trace) {
        log("i", ln, `prefix=${prefix}; item=`);
        console.dir(item);
      }
      trace ? log("", ln, `item.id=`, item.id) : null;
      result.push(item.getState());
    }
  }

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
   * Проходить по всім крокам та збирає інфо про їх стан
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
    let trace = 1,
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

  async start(stepN = 1) {
    let trace = 1,
      ln = this.ln + `Start(${stepN})::`;
    stepN = parseInt(stepN);
    if (isNaN(stepN)) {
      throw new Error("Invalid step number: " + stepN);
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
    this.program.start(stepN);

    // імя файлів логів   формуємо  у вигляді: "05-04-2024t10-11"
    let fileName = "";
    do {
      let newFileN = new Date().toLocaleString();
      //log(`newFileN=`, newFileN);
      newFileN = newFileN.replace(/\./g, "-");
      newFileN = newFileN.replace(/\:/g, "-");
      newFileN = newFileN.replace(", ", "t");
      fileName = newFileN.slice(0, -3);
      trace
        ? log("i", ln, `New log file name generated: fileName=`, fileName)
        : null;
    } while (this.loggerManager.fileManager.exist(fileName));

    await this.loggerManager.start(fileName);
    let data = {
      ua: `Програма "${this.program.header.ua}" почала виконання!`,
      en: `Program is "${this.program.header.en}" started!`,
      ru: `Програма "${this.program.header.ru}" запущена!`,
    };
    return { err: null, data };
  }

  stop() {
    this.program.stop();
    // for (let i = stepN; i < this.program.length; i++) {
    //   const element = this.program[i];
    // }
  }

  getCompactHtml(req) {
    return this.getFullHtml(req);
  }
}

module.exports = ClassProcessManager;
