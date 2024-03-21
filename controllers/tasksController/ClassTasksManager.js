const pug = require("pug");
const log = require("../../tools/log");
const ClassReg_select = require("../regsController/ClassReg_select.js");
const ClassReg_regsList = require("../regsController/ClassReg_regsList.js");
const ClassRegister = require("../regsController/ClassRegister.js");
// const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");
const pathNormalize = require("path").normalize;
const { readFileSync, writeFile } = require("fs");

/**
 * Клас виконує керування завданнями
 * для тестування при розробці створено локальний сервер
 * що знаходиться в теці ./tests/testServer/ npm start
 */

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
    this.homeDir = pathNormalize(props.homeDir + "tasksManager");
    // кореневий URL
    this.homeURL = props.homeURL ? props.homeURL + "tasksManager/" : "/";
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
      let trace = 1,
        ln = this.ln + "loadLastState::";
      let data = this.lastState.readFileSync(this.lastState.fileName);
      trace ? log(ln, `data=`, data) : null;
      data = JSON.parse(data ? data : "{value:default}");
      this.value = data.value ? data.value : "default";
    }

    // файловий менеджер, що відповідає за роботу з файлами завдань
    this.fileManager = new ClassFileManager({
      homeDir: this.homeDir + "/tasksList",
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

    // Додаємо крок 0 = опис програми
    let description = new ClassReg_regsList({
      id: "description",
      ln: "tasksDescription::",
      header: {
        ua: "Загальна інформація",
        en: "General descriptiom of program",
        ru: "Общее описание програмы",
      },
      comment: {
        ua: ``,
        en: ``,
        ru: ``,
      },
      editable: false, //крок не можна видаляти/додавати
      regs: {
        // опис поля Ім'я програми
        name: new ClassRegister({
          id: "name",
          type: "text",
          ln: "tasks.description.name::",
          value: "empty",
          header: {
            ua: `Назва програми`,
            en: `Program name`,
            ru: `Наименование программы`,
          },
          comment: {
            ua: `3..20 символів`,
            en: `3..20 characters`,
            ru: `3..20 символов`,
          },
        }),
        note: new ClassRegister({
          // опис поля примітки для програми
          id: "note",
          type: "textarea",
          ln: "tasks.description.note::",
          value: "empty",
          header: {
            ua: "Примітки",
            en: "Notes",
            ru: "Примечания",
          },
          comment: {
            ua: `Опис програми`,
            en: `Program description`,
            ru: `Описание программы`,
          },
        }),
      },
    });
    // додаємо крок
    this.addType(description);

    // Тут зберігається список кроків поточного завдання
    this.list = [];

    // завантажуємо поточний крок
    this.setCurrentValue(this.value);
    // this.loadTask();

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }

  /** Встановлює поточний список задач */
  async setCurrentValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    if (trace) {
      log("w", ln, `this.fileManager=`);
      console.dir(this.fileManager);
    }
    // якщо такого файлу не існує - помилка
    if (!this.fileManager.exist(val)) {
      let msg = ln + "Incorrect fileName: " + `[ ${val} ]`;
      throw new Error(msg);
    }
    await this.loadTask(val);

    if (this.value != val) {
      super.setValue(val);
      await this.lastState.writeFile(
        this.lastState.fileName,
        JSON.stringify({ value: this.value })
      );
    }
  }

  /** Завантажує список задач з файлу */
  async loadTask(fName = "default") {
    let trace = 1,
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

  getFullHtml() {
    let html = "";
    html = pug.renderFile(__dirname + "/views/editTasks.pug", {
      manager: this,
    });
    return html;
  }
} //class ClassTasksManager

module.exports = ClassTasksManager;
