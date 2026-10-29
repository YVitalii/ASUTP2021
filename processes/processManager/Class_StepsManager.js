const log = require("../../tools/log");
const ClassStepsSerial = require("../../controllers/ClassStep/ClassStepsSerial");

/**
 * Реєстр типів кроків і збірка програми зі списку завдань.
 * stepsList — Map: addStepType кладе тип, getStep дістає його.
 */
class Class_StepsManager {
  constructor(props = {}) {
    this.id = props.id ? props.id : "stepsManager";
    this.ln = props.ln ? props.ln : `Class_StepsManager(${this.id})::`;
    this.stepsList = new Map();
    this.program = {};
    this.listSteps = [];
    this.beforeProgramCreated =
      typeof props.beforeProgramCreated === "function"
        ? props.beforeProgramCreated
        : null;
  }

  /**
   * Реєструє тип кроку. StepObject мусить мати createStep(props).
   * @param {String} type
   * @param {Object} StepObject
   */
  addStepType(type, StepObject) {
    let ln = this.ln + "addStepType()::";
    if (typeof type !== "string" || type === "") {
      throw new Error(ln + "type має бути непорожнім рядком");
    }
    if (!StepObject || typeof StepObject.createStep !== "function") {
      throw new Error(ln + `тип "${type}" не має createStep(props)`);
    }
    if (this.stepsList.has(type)) {
      throw new Error(ln + `тип "${type}" уже зареєстровано`);
    }
    this.stepsList.set(type, StepObject);
  }

  /**
   * Створює екземпляр кроку за типом.
   * @param {String} type
   * @param {Object} props
   */
  getStep(type, props) {
    let ln = this.ln + "getStep()::";
    let StepObject = this.stepsList.get(type);
    if (!StepObject || typeof StepObject.createStep !== "function") {
      throw new Error(
        ln +
          `невідомий тип кроку "${type}". Зареєстровано: [` +
          Array.from(this.stepsList.keys()).join(", ") +
          "]",
      );
    }
    return StepObject.createStep(props);
  }

  /**
   * Тип кроку. Поле id лишається як застаріле ім'я type.
   * @param {Object} item
   * @param {String} ln
   * @returns {String}
   */
  stepType(item, ln) {
    if (!item || typeof item !== "object") return "";
    if (typeof item.type === "string" && item.type !== "") return item.type;
    if (typeof item.id === "string" && item.id !== "") {
      log("w", ln, `поле id застаріле, використовуйте type. id="${item.id}"`);
      return item.id;
    }
    return "";
  }

  /**
   * Рекурсивно розбирає крок або масив кроків.
   * Тип кроку — поле type. Ідентифікатор екземпляра — prefix.
   */
  setStep(prefix, arr, list) {
    let trace = 0,
      ln = this.ln + "setStep()::";
    trace
      ? log("i", ln, `prefix=${prefix}; list=`, JSON.stringify(list))
      : null;
    if (Array.isArray(list)) {
      let newArr = [];
      for (let j = 0; j < list.length; j++) {
        this.setStep(prefix + `_${j}`, newArr, list[j]);
      }
      arr.push(newArr);
    }
    let type = this.stepType(list, ln);
    if (!type) return;
    // Заголовок програми — не крок. Якщо тип description не зареєстровано, його не створюємо.
    if (type === "description" && !this.stepsList.has(type)) return;
    let props = { ...list };
    props.id = prefix;
    arr.push(this.getStep(type, props));
  }

  /**
   * Збирає ClassStepsSerial зі списку завдань.
   * Поки зібрана програма в стані going — нова не будується.
   * @param {Array|String} tasksList
   * @returns {{err: Object|null, data: Object|null}}
   */
  createProgram(tasksList) {
    let trace = 0,
      ln = this.ln + "createProgram()::";
    if (this.program.state && this.program.state._id == "going") {
      let err = {
        ua: `Не можна завантажити нову програму, в режимі виконання поточної`,
        en: `Can't set new tasks while the program is running`,
        ru: `Нельзя загрузить новую програму во время выполнения текущей `,
      };
      return { err, data: null };
    }

    if (typeof tasksList === "string") {
      try {
        tasksList = JSON.parse(tasksList);
      } catch (error) {
        let err = {
          ua: `Помилка розбору активної програми`,
          en: `Failed to parse active program`,
          ru: `Ошибка разбора активной программы`,
        };
        log("e", ln, err.ua, error.message || error);
        return { err, data: null };
      }
    }
    if (!Array.isArray(tasksList) || tasksList.length === 0) {
      let err = {
        ua: `Активна програма порожня або має невірний формат`,
        en: `Active program is empty or has invalid format`,
        ru: `Активная программа пуста или имеет неверный формат`,
      };
      log("e", ln, err.ua);
      return { err, data: null };
    }

    if (typeof this.beforeProgramCreated === "function") {
      const arg = { program: tasksList };
      const processed = this.beforeProgramCreated(arg);
      tasksList = Array.isArray(processed) ? processed : arg.program;
    }
    if (!Array.isArray(tasksList) || tasksList.length === 0) {
      let err = {
        ua: `Активна програма порожня або має невірний формат`,
        en: `Active program is empty or has invalid format`,
        ru: `Активная программа пуста или имеет неверный формат`,
      };
      log("e", ln, err.ua);
      return { err, data: null };
    }

    this.listSteps = tasksList;
    let program = [];
    try {
      this.setStep("st", program, tasksList);
    } catch (error) {
      let message = error && error.message ? error.message : String(error);
      log("e", ln, message);
      return {
        err: { ua: message, en: message, ru: message },
        data: null,
      };
    }
    if (!Array.isArray(program[0]) || program[0].length <= 0) {
      let err = {
        ua: `Не вдалося побудувати кроки програми`,
        en: `Failed to build program steps`,
        ru: `Не удалось построить шаги программы`,
      };
      log("e", ln, err.ua);
      return { err, data: null };
    }

    let head = tasksList[0] || {};
    let name = head.name;
    let programId = "prg_" + head.fName;
    this.program = new ClassStepsSerial({
      id: programId,
      header: {
        ua: head.fName,
        en: head.fName,
        ru: head.fName,
      },
      comment: {
        ua: head.description,
        en: head.description,
        ru: head.description,
      },
      ln: programId + "::",
      tasks: program[0],
    });

    trace = 0;
    if (trace) {
      log("i", ln, `this.program.tasks=`);
      console.dir(this.program.tasks, { depth: 3 });
    }
    let data = {
      ua: `Програму "${name}" успішно завантажено.`,
      en: `Program "${name}" was set successfully.`,
      ru: `Программа "${name}" успешно загружена.`,
    };
    return { err: null, data };
  }
}

module.exports = Class_StepsManager;
