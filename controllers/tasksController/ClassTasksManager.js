const pug = require("pug");
const log = require("../../tools/log");
const ClassReg_select = require("../regsController/ClassReg_select.js");
const ClassReg_regsList = require("../regsController/ClassReg_regsList.js");
const ClassRegister = require("../regsController/ClassRegister.js");
const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");
const pathNormalize = require("path").normalize;

/**
 * Клас виконує керування завданнями
 *
 */

class ClassTasksManager extends ClassReg_select {
  constructor(props = {}) {
    // ідентифікатор
    props.id = "TasksManager";

    props.comment = {
      ua: `Після редагування програми натисніть кнопку [Застосувати]`,
      en: `After program creation, push [Accept] button`,
      ru: `После редактирования програмы, нажмите кнопку [Применить] `,
    };

    props.header = {
      ua: `Створення програми`,
      en: `Program creating`,
      ru: `Создание программы`,
    };

    props.type = "regsList";
    props.value = "empty";

    super(props);

    this.ln = "ClassTasksManager::";
    let trace = 0,
      ln = this.ln + "constructor()::";
    trace ? log("w", ln, `======= Started =====`) : null;
    //
    if (!props.homeDir) {
      throw new Error(this.ln + "homeDir not defined! ");
    }
    this.homeDir = pathNormalize(props.homeDir + "\\tasks");
    this.fileManager = new ClassFileManager({
      homeDir: this.homeDir,
      ln: this.ln,
    });
    this.fileManager.reg = new ClassReg_regsList({
      id: "tasksList",
      header: {
        ua: `Робота зі списком завдань`,
        en: `Working with list of tasks`,
        ru: `Работа со списком заданий`,
      },
      comment: {
        ua: ``,
        en: ``,
        ru: ``,
      },
    });
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
      editable: false,
      regs: {
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

    this.addType(description);
    this.list = [];
    // Тут зберігається список впорядкованих кроків
    this.loadList();

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }

  /** Завантажує список задач з файлу */
  async loadList(fName = "default.json") {
    let data = "";
    try {
      data = await this.fileManager.readFile(fName);
      this.list = JSON.parse(data);
    } catch (error) {
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
} //class ClassThermoStep

module.exports = ClassTasksManager;
