const pug = require("pug");

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
    // Тут мають зберігатися всі можливі типи кроків
    this.types = {};
    // Тут зберігається список впорядкованих кроків
    this.list = [];
  }

  addType(task = {}) {
    let trace = 1,
      ln = this.ln + `addType()::`;
    if (!task.type) {
      throw new Error(ln + "Тип кроку має бутии вказаний");
    }
    if (this.types[task.type.id]) {
      throw new Error(ln + `Тип [${task.type.id}] вже зареєстрований!`);
    }
    this.types[task.type.id] = task;
  }

  getFullHtml() {
    let html = "";
    html = pug.renderFile(__dirname + "/views/editTasks.pug", {
      types: this.types,
      list: this.list,
    });
    return html;
  }
} //class ClassThermoStep

module.exports = ClassTasksManager;
