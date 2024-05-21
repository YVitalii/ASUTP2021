const pug = require("pug");
const log = require("../../tools/log");
const ClassReg_select = require("../regsController/ClassReg_select.js");
const ClassReg_regsList = require("../regsController/ClassReg_regsList.js");
const ClassRegister = require("../regsController/ClassRegister.js");
// const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");
const pathNormalize = require("path").normalize;
const pathResolve = require("path").resolve;
//const { readFileSync, writeFile } = require("fs");
const ClassTaskDescriptionStep = require("./ClassTaskDescriptionStep.js");
// const { chdir } = require("process");
/**
 * Клас виконує керування завданнями
 * для тестування при розробці створено локальний сервер
 * що знаходиться в теці ./tests/testServer/ npm start
 */
const clone = require("clone");

class ClassTasksManager extends ClassReg_select {
  /**
   * Створює менеджер задач
   * @param {Object} props - параметри
   * @property {String} props.homeDir
   * @property {String} props.homeURL
   */
  constructor(props = {}) {
    // ідентифікатор
    props.id = "TasksManager";

    props.comment = {
      ua: `Після редагування програми натисніть кнопку [Застосувати]`,
      en: `After program creation, push [Accept] button`,
      ru: `После редактирования програмы, нажмите кнопку [Применить] `,
    };

    props.header = {
      ua: `Редагування програми`,
      en: `Program editing`,
      ru: `Редактирование программы`,
    };

    props.type = "regsList"; // ?
    props.value = "empty"; //?

    super(props);

    this.ln = this.ln ? this.ln : "ClassTasksManager::";
    let trace = 0,
      ln = this.ln + "constructor()::";

    if (trace) {
      console.log(ln + `======= Started ===== props=`);
      console.dir(props);
    }
    //
    if (!props.homeDir) {
      throw new Error(this.ln + "homeDir not defined! ");
    }
    // домашня директорія
    this.homeDir = pathResolve(props.homeDir, "tasksManager");
    trace ? log("i", ln, `this.homeDir=`, this.homeDir) : null;
    // кореневий URL
    this.homeURL = props.homeURL ? props.homeURL + "/tasksManager/" : "/";
    // робота з файлом поточного стану
    this.lastState = new ClassFileManager({
      homeDir: this.homeDir,
      ln: this.ln + "lastState::",
    });
    this.lastState.fileName = "state.info";
    if (!this.lastState.exist(this.lastState.fileName)) {
      // якщо файлу зі збереженим станом немає - створюємо його
      this.lastState.writeFile(
        this.lastState.fileName,
        JSON.stringify({ value: "default" })
      );
      this.value = "default";
    } else {
      // якщо файл існує - завантажуємо
      let trace = 0,
        ln = this.ln + "loadLastState::";
      let data = this.lastState.readFileSync(this.lastState.fileName);
      trace ? log(ln, `data=`, data) : null;
      data = JSON.parse(data ? data : JSON.stringify({ value: "default" }));
      this.value = data.value ? data.value : "default";
    }

    // файловий менеджер, що відповідає за роботу з файлами завдань
    this.fileManager = new ClassFileManager({
      homeDir: pathNormalize(this.homeDir + "/tasksList"),
      ln: this.ln,
      homeURL: this.homeURL + "fileManager/",
    });

    // Опис для елементу DOM fileManager
    this.fileManager.reg = new ClassReg_regsList({
      id: "tasksList",
      header: {
        // заголовок
        ua: `Робота зі списком завдань`,
        en: `Working with list of tasks`,
        ru: `Работа со списком заданий`,
      },
      comment: {
        // коментарій
        ua: ``,
        en: ``,
        ru: ``,
      },
      value: this.value,
    });

    // в список регістрів додаємо опис поля вибору файлів
    // за потреби можна додати інші регістри
    this.fileManager.reg.regs.fileNames = new ClassRegister({
      id: "fileNames",
      type: "simpleSelect",
      header: {
        ua: `Перелік програм`,
        en: `The list of programs`,
        ru: `Список программ`,
      },
      comment: {
        ua: `Виберіть програму`,
        en: `Select program`,
        ru: `Выберите програму`,
      },
    });
    this.fileManager.reg.regs.fileNames.list = this.fileManager.filesList;

    // Тут мають зберігатися всі можливі типи кроків
    this.reg = new ClassReg_select({
      id: "taskType",
      header: {
        ua: "Тип кроку",
        en: "Select type of step",
        ru: "Тип шага",
      },
      comment: {
        ua: `Доступні типи`,
        en: `Avaliable types`,
        ru: `Доступные типы`,
      },
      regs: {},
      type: "regsList",
    });

    let description = new ClassTaskDescriptionStep();
    // додаємо крок
    this.addType(description);

    // Тут зберігається список кроків поточного завдання
    this.list = [];

    // завантажуємо поточний крок
    this.setCurrentValue(this.value);
    // this.loadTask();

    // тут має зберігатися скомпільована програма

    this.program = [];

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this, { depth: 3 });
    }
  }

  /** Встановлює поточний список задач для виконання */
  async setCurrentValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    if (trace) {
      log("w", ln, `this.fileManager=`);
      console.dir(this.fileManager);
    }
    // якщо такого файлу не існує - помилка
    if (!this.fileManager.exist(val)) {
      // TODO При установці виникає помилка так як файл типової програми ще не існує
      // якщо неіснує - потрібно автоматично його створювати на основі getDefaultStep()
      // функцію getDefaultStep() - потрібно буде створити в кожному менеджері задач,

      let msg =
        ln + "Incorrect fileName: " + `[${this.fileManager.homeDir}\\${val}]`;
      if (trace) {
        log("i", ln, `this.fileManager.getFilesList()=`);
        console.dir(this.fileManager.getFilesList());
      }
      throw new Error(msg);
    }
    await this.loadTask(val);
    //this.makeProgram();
    if (this.value != val) {
      super.setValue(val);
      await this.lastState.writeFile(
        this.lastState.fileName,
        JSON.stringify({ value: this.value })
      );
    }
  }

  // /**
  //  * Функція перетворює список задач в список кроків для виконання
  //  * наприклад задача ThermProcess може бути розбита на кроки: heating,holding і т.д.
  //  *
  //  */
  // makeProgram() {
  //   let trace = 1,
  //     ln = this.ln + "makeProgram()::";
  //   let list = this.list;
  //   if (trace) {
  //     log("i", ln, `list=`);
  //     console.dir(list);
  //   }
  //   // очищуємо місце для програми
  //   this.program = [];
  //   // перебираємо всі кроки в завданні
  //   for (let i = 0; i < this.list.length; i++) {
  //     const element = this.list[i];
  //     // для кожного кроку отримуємо його менеджера
  //     let manager = this.reg.regs[element.id];
  //     // if (trace) {
  //     //   log("i", ln, `manager=`);
  //     //   console.dir(manager);
  //     // }
  //     // якщо менеджер знайдено, формуємо крок
  //     if (manager) {
  //       let step = manager.getStep(element);
  //       this.program.push(step);
  //     }
  //   }
  //   if (trace) {
  //     log("i", ln, `this.program[1]=`);
  //     console.dir(this.program[1], { depth: 3 });
  //   }

  //   // let description = new this.regs['description'];
  // }

  /** Повертає посилання на контролер кроку */
  getTask(taskId) {
    let task = this.reg.regs[taskId];
    if (!task) {
      throw new Error(this.ln + `getTask(${taskId}):: not defined!`);
    }
    return task;
  }

  /** Завантажує список задач з файлу
   *
   */
  async loadTask(fName = "default") {
    // TODO Потрібно зробити автоматичне створення нового шаблонного файлу default.tsk,
    // якщо його ще не існує в такому випадку не буде збоїв
    //  наприклад: 0. Крок з описом. 1. Перший тип в списку типів всі значення по замовчуванню
    let trace = 0,
      ln = this.ln + `loadTask(${fName})::`;
    let data = "";
    try {
      data = await this.fileManager.readFile(fName);
      this.list = JSON.parse(data);
      if (trace) {
        log("i", ln, `this.list=`);
        console.dir(this.list);
      }
    } catch (error) {
      log("e", ln + "Can`t read default tasks file! Create it!");
      throw error;
    }
  }

  /**
   * реєструє новий тип кроку.
   * @param {Class} task - нащадок класу ClassTaskGeneral
   */
  addType(task = {}) {
    let trace = 0,
      ln = this.ln + `addType()::`;
    if (trace) {
      log("i", ln, `task=`);
      console.dir(task);
    }
    if (!task.type) {
      throw new Error(ln + "Тип кроку має бути вказаний");
    }
    if (this.reg.regs[task.id]) {
      throw new Error(ln + `Крок [${task.id}] вже зареєстрований!`);
    }
    this.reg.regs[task.id] = task;
  }
  /**
   * Виконує пошук в списку доступних кроків та повертає конструктор
   * @param {String} id - id кроку
   * @returns
   */
  getType(id) {
    return this.reg.regs[id];
  }
  /**
   * генерує код для вставляння в веб сторінку
   * @returns html
   */
  getFullHtml(req) {
    let trace = 0,
      ln = this.ln + `getFullHtml(${req.id})::`;
    let reg = clone(this.reg);

    reg.regs = {};
    if (trace) {
      log("i", ln, `Cloned reg=`);
      console.dir(reg);
    }
    // перебираємо всі можливі кроки та отримуємо копію опису для рендерингу
    // якщо цього не зробити, в браузер передається повна копія об'єкту
    // разом з iface, devices та інше
    for (const key in this.reg.regs) {
      if (Object.hasOwnProperty.call(this.reg.regs, key)) {
        const element = this.reg.regs[key];
        reg.regs[key] = element.getRegForHtml();
      }
    }
    let manager = {
      header: this.header,
      id: this.id,
      reg,
      list: this.list,
      homeURL: this.homeURL,
      value: this.value,
      fileManager: {
        filesList: this.fileManager.getFilesList(),
        homeURL: this.fileManager.homeURL,
      },
    };
    if (trace) {
      log("i", ln, `manager=`);
      console.dir(manager);
    }
    let html = "";
    html = pug.renderFile(__dirname + "/views/editTasks.pug", {
      req,
      manager,
    });
    return html;
  }
} //class ClassTasksManager

module.exports = ClassTasksManager;
