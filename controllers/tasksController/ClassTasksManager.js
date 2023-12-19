const pug = require("pug");
const log = require("../../tools/log");
const ClassRegister = require("../ClassRegister.js");

class ClassTasksManager {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    let trace = 1;
    this.ln = "ClassTasksManager(" + props.id + ")::";
    let ln = this.ln + "constructor()::";
    trace ? log("w", ln, `======= Started =====`) : null;
    this.id = "TasksManager";
    this.comment = {
      ua: `Створення програми`,
      en: `Program creation`,
      ru: `Создание прграммы`,
    };
    this.header = {
      ua: `Створення програми`,
      en: `Program creating`,
      ru: `Создание программы`,
    };
    // Тут мають зберігатися всі можливі типи кроків
    this.types = new ClassRegister({
      id: "taskType",
      type: "select",
      header: {
        ua: "Виберіть тип кроку",
        en: "Select type of step",
        ru: "Выберите тип шага",
      },
      comment: {
        ua: `Доступні задачі`,
        en: `Avaliable tasks`,
        ru: `Доступные задачи `,
      },
    });

    // Тут зберігається список впорядкованих кроків
    this.list = [];
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
    // Додаємо пустий крок-заглушку
    this.addType(
      new ClassRegister({
        id: "empty",
        header: {
          ua: "Виберіть тип кроку",
          en: "Select type of step",
          ru: "Выберите тип шага",
        },
        comment: {
          ua: `Тип кроку не вказано`,
          en: `Type of the Step not defined`,
          ru: `Тип шага не указан`,
        },
        type: "taskType",
      })
    );
  }

  addType(task = {}) {
    let trace = 1,
      ln = this.ln + `addType()::`;
    if (trace) {
      log("i", ln, `task=`);
      console.dir(task);
    }
    if (!task.type) {
      throw new Error(ln + "Тип кроку має бути вказаний");
    }
    if (this.types.regs[task.id]) {
      throw new Error(ln + `Тип [${task.id}] вже зареєстрований!`);
    }
    this.types.regs[task.id] = task;
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
