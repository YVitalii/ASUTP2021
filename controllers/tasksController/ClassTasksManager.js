const fs = require("fs");
const clone = require("clone");
const pathNormalize = require("path").normalize;
const pathJoin = require("path").join;
const ClassRegister = require("../regsController/ClassRegister.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");

/**
 * Менеджер програм.
 * Попередня реалізація лежить у ./archiv.
 */
class ClassTasksManager extends ClassRegister {
  /**
   * @param {Object} props
   * @property {String} props.homeDir - домашня директорія сутності
   * @property {String} props.homeUrl - базова адреса сутності
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
      throw new Error(this.ln + "homeDir not defined! ");
    }
    const homeDir = pathNormalize(props.homeDir + "/tasksManager/");
    const homeURL = (props.homeUrl ? props.homeUrl : "") + "/tasksManager/";
    this.path = {
      homeDir,
      homeURL,
      programDir: pathNormalize(homeDir + "tasksList/"),
      stateFile: pathNormalize(homeDir + "state.info"),
    };

    this.activeTask = { fileName: null, content: null }; // активне завдання
    this.tasksList = []; // список завдань

    // файловий менеджер, що відповідає за роботу з файлами завдань
    this.fileManager = new ClassFileManager({
      homeDir: this.path.programDir,
      ln: this.ln,
      homeURL: this.path.homeURL + "fileManager/",
    });

    this.initSync();
  }

  /**
   * Синхронна ініціалізація: каталоги, state.info, активна програма.
   * Див. task.puml → initSync().
   */
  initSync() {
    let ln = this.ln + "initSync()::";

    if (!fs.existsSync(this.path.programDir)) {
      fs.mkdirSync(this.path.programDir, { recursive: true });
    } else {
      this.tasksList = fs.readdirSync(this.path.programDir);
    }

    if (!fs.existsSync(this.path.stateFile)) {
      let defaultProgram = pathJoin(this.path.programDir, "default");
      if (!fs.existsSync(defaultProgram)) {
        throw new Error(ln + "Default task file not found");
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
    this.activeTask.fileName = state.activeProgram;
    this.activeTask.content = this.fileManager.readFileSync(
      this.activeTask.fileName
    );
  }

  /**
   * Завантажує завдання.
   * @param {String} [taskName] - ім'я файлу програми; якщо не вказано — активне
   * @returns {Promise<String|Object|Array>} content активного або розпарсений файл
   */
  async loadTask(taskName = undefined) {
    if (!taskName) {
      return this.activeTask.content;
    }
    let data = await this.fileManager.readFile(taskName);
    return JSON.parse(data);
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
   * Створює або перезаписує файл програми.
   * @param {String} [taskName] - ім'я файлу в programDir
   * @param {String|Object|Array} [content] - вміст файлу
   */
  async saveTask(taskName = undefined, content = undefined) {
    let ln = this.ln + "saveTask()::";
    if (!taskName || content === undefined) {
      throw new Error(ln + "taskName and content are required");
    }
    await this.fileManager.writeFile(taskName, content);
    if (!this.tasksList.includes(taskName)) {
      this.tasksList.push(taskName);
    }
  }

  /**
   * Видаляє файл програми та прибирає його з tasksList.
   * @param {String} taskName - ім'я файлу в programDir
   */
  async deleteTask(taskName) {
    let ln = this.ln + "deleteTask()::";
    if (!taskName) {
      throw new Error(ln + "taskName is required");
    }
    if (!this.fileManager.exist(taskName)) {
      throw new Error(ln + "Task file not found: " + taskName);
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
   * Встановлює активне завдання.
   * @param {String} [taskName] - ім'я файлу програми
   */
  async setActiveTask(taskName = undefined) {
    let ln = this.ln + "setActiveTask()::";
    if (!taskName || !this.fileManager.exist(taskName)) {
      throw new Error(ln + "Task file not found: " + taskName);
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
      throw new Error(ln + (error.message || error));
    }
  }
}

module.exports = ClassTasksManager;
