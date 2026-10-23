const fs = require("fs");
const pug = require("pug");
const clone = require("clone");
const pathNormalize = require("path").normalize;
const pathJoin = require("path").join;
const ClassRegister = require("../regsController/ClassRegister.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");
const APIerror = require("../../tools/apiError.js");
const ClassTaskDescriptionStep = require("./ClassTaskDescriptionStep.js");

/**
 * Менеджер програм.
 * Попередня реалізація лежить у ./archiv.
 */
class ClassTasksManager extends ClassRegister {
  /**
   * @param {Object} props
   * @property {String} props.homeDir - домашня директорія сутності
   * @property {String} props.homeURL - базова адреса сутності
   */
  constructor(props = {}) {
    props.header = {
      ua: "Редагування програми",
      en: "Program editing",
      ru: "Редактирование программы",
    };
    props.id = "TasksManager";
    // ClassRegister вимагає type до super()
    props.type = props.type ? props.type : props.id;
    super(props);

    this.ln = this.ln ? this.ln : "Class" + this.id + "::";
    let trace = 0,
      ln = this.ln + "constructor()::";

    if (trace) {
      console.log(ln + `======= Started ===== props=`);
      console.dir(props);
    }
    if (!props.homeDir) {
      throw new APIerror({
        ua: "Не вказано домашню директорію (homeDir)",
        en: "Home directory (homeDir) is not defined",
        ru: "Не указана домашняя директория (homeDir)",
      });
    }
    const homeDir = pathNormalize(props.homeDir + "/tasksManager/");
    const entityUrl = (props.homeURL || "").replace(
      /\/$/,
      ""
    );
    const homeURL = entityUrl + "/tasksManager/";
    this.path = {
      homeDir,
      homeURL,
      programDir: pathNormalize(homeDir + "tasksList/"),
      stateFile: pathNormalize(homeDir + "state.info"),
    };
    this.homeURL = homeURL;
    this.activeTask = { fileName: null, content: null }; // активне завдання
    this.tasksList = []; // список завдань
    this.availableTasksTypes = new Map(); // зареєстровані типи кроків

    // базовий крок опису програми (як у попередній реалізації)
    this.addTaskType(new ClassTaskDescriptionStep());

    // файловий менеджер, що відповідає за роботу з файлами завдань
    this.fileManager = new ClassFileManager({
      homeDir: this.path.programDir,
      ln: this.ln,
      homeURL: this.path.homeURL + "fileManager/",
    });

    this.initSync();
  }

  /**
   * Реєструє тип кроку. Повторний id заборонений.
   * @param {Object} taskItem - опис типу кроку з полем id
   */
  addTaskType(taskItem) {
    if (!taskItem || !taskItem.id) {
      console.dir(taskItem);
      throw new APIerror({
        ua: "Не вказано id типу кроку",
        en: "Task type id is required",
        ru: "Не указан id типа шага",
      });
    }
    if (this.availableTasksTypes.has(taskItem.id)) {
      throw new APIerror({
        ua: `Тип кроку вже існує: ${taskItem.id}`,
        en: `Task type already exists: ${taskItem.id}`,
        ru: `Тип шага уже существует: ${taskItem.id}`,
      });
    }
    this.availableTasksTypes.set(taskItem.id, taskItem);
  }

  /** для сумісності  */
  addType(taskItem){
    this.addTaskType(taskItem);
  }
  
  /**
   * Повертає опис зареєстрованих типів кроків.
   * @returns {Object} { [id]: getDescription() }
   */
  getTasksDescription() {
    const descriptions = {};
    for (const id of this.availableTasksTypes.keys()) {
      const task = this.availableTasksTypes.get(id);
      let description = task.getDescription;
      if (typeof description === "function") {
        description = description.call(task);
      }
      if (description == null) {
        description = {
          id: task.id,
          header: task.header,
          comment: task.comment,
        };
      }
      descriptions[id] = description;
    }
    return descriptions;
  }

  /**
   * Повертає зареєстрований тип кроку.
   * @param {String} taskId
   */
  getTask(taskId) {
    return this.availableTasksTypes.get(taskId);
  }

  getType(taskId) {
    return  this.getTask(taskId);
  }

  /**
   * Синхронна ініціалізація: каталоги, state.info, активна програма.
   * Див. task.puml → initSync().
   */
  initSync() {
    if (!fs.existsSync(this.path.programDir)) {
      fs.mkdirSync(this.path.programDir, { recursive: true });
    } else {
      this.tasksList = fs.readdirSync(this.path.programDir);
    }

    if (!fs.existsSync(this.path.stateFile)) {
      let defaultProgram = pathJoin(this.path.programDir, "default");
      if (!fs.existsSync(defaultProgram)) {
        throw new APIerror({
          ua: "Файл шаблону програми (default) не знайдено",
          en: "Default program template file not found",
          ru: "Файл шаблона программы (default) не найден",
        });
      }
      fs.writeFileSync(
        this.path.stateFile,
        JSON.stringify({
          activeProgram: "default",
          lastChange: Date.now(),
        })
      );
    }

    let state = JSON.parse(fs.readFileSync(this.path.stateFile, "utf8"));
    // підтримка старого формату { value } і нового { activeProgram }
    let activeProgram = state.activeProgram || state.value;
    if (!activeProgram) {
      throw new APIerror({
        ua: "У state.info не вказано активну програму",
        en: "Active program is not defined in state.info",
        ru: "В state.info не указана активная программа",
      });
    }
    if (!this.fileManager.exist(activeProgram)) {
      throw new APIerror({
        ua: `Файл активної програми не знайдено: ${activeProgram}`,
        en: `Active program file not found: ${activeProgram}`,
        ru: `Файл активной программы не найден: ${activeProgram}`,
      });
    }
    this.activeTask.fileName = activeProgram;
    this.activeTask.content = this.parseProgramContent(
      this.fileManager.readFileSync(activeProgram)
    );

    // міграція старого формату state.info → новий
    if (!state.activeProgram || state.value !== undefined) {
      fs.writeFileSync(
        this.path.stateFile,
        JSON.stringify({
          activeProgram,
          lastChange: state.lastChange || Date.now(),
        })
      );
    }
  }

  /**
   * Парсить вміст програми з файлу (рядок JSON → об'єкт/масив).
   * @param {String|Object|Array} data
   */
  parseProgramContent(data) {
    if (data === undefined || data === null || data === "") {
      throw new APIerror({
        ua: "Вміст програми порожній",
        en: "Program content is empty",
        ru: "Содержимое программы пустое",
      });
    }
    if (typeof data !== "string") {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new APIerror({
        ua: "Неможливо розпарсити вміст програми",
        en: "Cannot parse program content",
        ru: "Невозможно разобрать содержимое программы",
      });
    }
  }

  /**
   * Завантажує завдання.
   * @param {String} [taskName] - ім'я файлу програми; якщо не вказано — активне
   * @returns {Promise<Object|Array>} content активного або розпарсений файл
   */
  async loadTask(taskName = undefined) {
    if (!taskName || this.activeTask.fileName == taskName) {
      return this.activeTask.content;
    }
    let data = await this.fileManager.readFile(taskName);
    return this.parseProgramContent(data);
  }

  /**
   * Асинхронно читає список файлів програм у programDir.
   * @returns {Promise<String[]>} this.tasksList
   */
  async readTasksList() {
    this.tasksList = await fs.promises.readdir(this.path.programDir);
    return this.tasksList;
  }

  /**
   * Повертає збережений у пам'яті список завдань.
   * @returns {String[]}
   */
  getTasksList() {
    return this.tasksList;
  }

  /**
   * Ім'я програми для списку вибору: заголовок [0].fName, інакше ім'я файлу.
   * @param {*} content
   * @param {String} fileName
   * @returns {String}
   */
  programFName(content, fileName) {
    const header = Array.isArray(content) ? content[0] : null;
    if (header && typeof header === "object") {
      const name = header.fName || header.title;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
    return fileName;
  }

  /**
   * fName програми у файлі. Якщо файл не читається — ім'я файлу.
   * @param {String} fileName
   * @returns {String}
   */
  fNameOfFile(fileName) {
    try {
      const content = this.parseProgramContent(
        this.fileManager.readFileSync(fileName)
      );
      return this.programFName(content, fileName);
    } catch (error) {
      return fileName;
    }
  }

  /**
   * Список fName для вибору програми.
   * @returns {String[]}
   */
  getProgramFNames() {
    return this.tasksList
      .map((fileName) => this.fNameOfFile(fileName))
      .sort((a, b) => a.localeCompare(b, "uk", { numeric: true }));
  }

  /**
   * Знаходить файл за fName. Якщо окремого файлу з таким ім'ям немає,
   * шукає програму, у заголовку якої записаний цей fName.
   * @param {String} fName
   * @returns {String}
   */
  resolveTaskFile(fName) {
    if (!fName || this.fileManager.exist(fName)) return fName;
    const found = this.tasksList.find(
      (fileName) => this.fNameOfFile(fileName) === fName
    );
    return found || fName;
  }

  /**
   * Створює або перезаписує файл програми.
   * @param {String} [taskName] - ім'я файлу в programDir
   * @param {String|Object|Array} [content] - вміст файлу
   */
  async saveTask(taskName = undefined, content = undefined) {
    if (!taskName || content === undefined) {
      throw new APIerror({
        ua: "Потрібно вказати taskName та content",
        en: "taskName and content are required",
        ru: "Необходимо указать taskName и content",
      });
    }
    if (taskName === "default") {
      throw new APIerror({
        ua: "Не можна змінювати шаблон програми",
        en: "Cannot modify the program template",
        ru: "Нельзя изменять шаблон программы",
      });
    }
    let data = content;
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
      data[0].fName = taskName;
    }
    await this.fileManager.writeFile(taskName, data);
    if (this.activeTask.fileName === taskName) {
      this.activeTask.content = clone(data);
    }
    if (!this.tasksList.includes(taskName)) {
      this.tasksList.push(taskName);
    }
  }

  /**
   * Видаляє файл програми та прибирає його з tasksList.
   * @param {String} taskName - ім'я файлу в programDir
   */
  async deleteTask(taskName) {
    if (!taskName) {
      throw new APIerror({
        ua: "Потрібно вказати taskName",
        en: "taskName is required",
        ru: "Необходимо указать taskName",
      });
    }
    if (taskName === "default") {
      throw new APIerror({
        ua: "Не можна видаляти шаблон програми",
        en: "Cannot delete the program template",
        ru: "Нельзя удалять шаблон программы",
      });
    }
    if (taskName === this.activeTask.fileName) {
      throw new APIerror({
        ua: "Не можна видаляти активну програму",
        en: "Cannot delete the active program",
        ru: "Нельзя удалять активную программу",
      });
    }
    if (!this.fileManager.exist(taskName)) {
      throw new APIerror({
        ua: `Файл програми не знайдено: ${taskName}`,
        en: `Task file not found: ${taskName}`,
        ru: `Файл программы не найден: ${taskName}`,
      });
    }
    await this.fileManager.deleteFile(taskName);
    this.tasksList = this.tasksList.filter((name) => name !== taskName);
  }

  /**
   * Повертає копію активного завдання.
   * @returns {{taskName: String, content: *}}
   */
  getActiveTask() {
    return {
      taskName: this.activeTask.fileName,
      content: clone(this.activeTask.content),
    };
  }

  /**
   * Рендерить pug-шаблон редактора програм і повертає HTML.
   * Дані редактор завантажує сам через API — шаблон не використовує manager.
   * @returns {String} html
   */
  getFullHtml() {
    return pug.renderFile(pathJoin(__dirname, "views", "editTasks.pug"));
  }

  /**
   * Встановлює активне завдання.
   * @param {String} [taskName] - ім'я файлу програми
   */
  async setActiveTask(taskName = undefined) {
    if (!taskName || !this.fileManager.exist(taskName)) {
      throw new APIerror({
        ua: `Файл програми не знайдено: ${taskName}`,
        en: `Task file not found: ${taskName}`,
        ru: `Файл программы не найден: ${taskName}`,
      });
    }
    try {
      let content = await this.loadTask(taskName);
      this.activeTask.fileName = taskName;
      this.activeTask.content = content;
      await fs.promises.writeFile(
        this.path.stateFile,
        JSON.stringify({
          activeProgram: taskName,
          lastChange: Date.now(),
        })
      );
    } catch (error) {
      if (error && error.msg) {
        throw error;
      }
      throw new APIerror({
        ua: `Не вдалося встановити активну програму: ${error.message || error}`,
        en: `Failed to set active program: ${error.message || error}`,
        ru: `Не удалось установить активную программу: ${error.message || error}`,
      });
    }
  }
}

module.exports = ClassTasksManager;
