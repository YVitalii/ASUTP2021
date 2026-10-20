const pathNormalize = require("path").normalize;
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

    this.ln = this.ln ? this.ln : "Class"+this.id+"::";
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
    // робота з файлом поточного стану
    this.lastState = new ClassFileManager({
      homeDir: this.path.homeDir,
      ln: this.ln + "lastState::",
    });
    this.lastState.fileName = "state.info";

    // файловий менеджер, що відповідає за роботу з файлами завдань
    this.fileManager = new ClassFileManager({
      homeDir: this.path.programDir,
      ln: this.ln,
      homeURL: this.path.homeURL + "fileManager/",
    });
  }
}

module.exports = ClassTasksManager;
