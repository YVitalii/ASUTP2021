const pug = require("pug");
const log = require("../../tools/log");
const ClassReg_select = require("../regsController/ClassReg_select.js");
const ClassRegister = require("../regsController/ClassRegister.js");
const ClassTaskGeneral = require("../tasksController/Class_Task_general.js");

class ClassTasksManager extends ClassReg_select {
  constructor(props = {}) {
    props.id = "TasksManager";
    props.comment = {
      ua: `Після редадгування програми натисніть кнопку [Застосувати]`,
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
    this.ln = "ClassTasksManager(" + props.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    trace ? log("w", ln, `======= Started =====`) : null;

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

    // Додаємо пустий крок-заглушку
    let emptyStep = new ClassTaskGeneral({
      id: "empty",
      type: "regsList",
      header: {
        ua: "Пусто",
        en: "Empty",
        ru: "Пусто",
      },
      comment: {
        ua: `Тип кроку не вказано`,
        en: `Type of the Step not defined`,
        ru: `Тип шага не указан`,
      },
      regs: {},
    });

    this.addType(emptyStep);

    // Тут зберігається список впорядкованих кроків
    this.list = this.loadList();

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }
  loadList(name = "default.tsk") {
    // TODO костиль тут має бути завантаження програми з файлу
    let list = [];
    list.push({
      id: "TaskThermal",
      tT: 500,
      errTmin: -15,
      errTmax: 15,
      regMode: "pid",
      o: 10,
      i: 10,
      d: 10,
    });
    list.push({
      id: "TaskNitriding",
      kN: 1.2,
      regMode: "pid",
      o: 10,
      i: 10,
      d: 10,
    });
    return list;
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
