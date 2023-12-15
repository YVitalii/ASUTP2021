const pug = require("pug");
const log = require("../../tools/log");

class ClassTasksManager {
  /**
   * Конструктор класу, оптимізованого під процеси термообробки
   * @param {*} props
   * @property {}
   */

  constructor(props = {}) {
    let trace = 1;
    this.ln = "ClassTaskManager::";
    let ln = this.ln + "constructor()::";
    this.title = {
      ua: `Створення програми`,
      en: `Program creation`,
      ru: `Создание прграммы`,
    };
    // Тут мають зберігатися всі можливі типи кроків
    this.types = {
      type: {
        id: "taskType",
        header: {
          ua: "Виберіть тип кроку",
          en: "Select type of step",
          ru: "Выберите тип шага",
        },
        title: {
          ua: `Доступні задачі`,
          en: `Avaliable tasks`,
          ru: `Доступные задачи `,
        },
      },
      regs: {},
    };
    // Тут зберігається список впорядкованих кроків
    this.list = [];
    this.addType({
      type: {
        id: "empty",
        title: {
          ua: `Не вказаний`,
          en: `Not defined`,
          ru: `Не указан`,
        },
      },
      regs: {
        empty: {
          id: "empty",
          header: {
            ua: "Виберіть тип кроку",
            en: "Select type of step",
            ru: "Выберите тип шага",
          },
          type: "info",
          //value: undefined,
          title: {
            ua: `Тип кроку не вказано`,
            en: `Type of the Step not defined`,
            ru: `Тип шага не указан`,
          },
          // min: 0,
          // max: -100,
        },
      },
    });
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
    if (this.types.regs[task.type.id]) {
      throw new Error(ln + `Тип [${task.type.id}] вже зареєстрований!`);
    }
    this.types.regs[task.type.id] = task;
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
