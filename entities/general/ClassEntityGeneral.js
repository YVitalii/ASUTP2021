const log = require("../../tools/log.js");
const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassDevicesManager = require("../../devices/devicesManager/ClassDevicesManager.js");
const ClassLoggerManager = require("../../controllers/loggerManager/ClassLoggerManager.js");
const ClassProcessManager = require("../../processes/processManager/ClassProcessManager.js");

const test = require("../../config.js").test;

class ClassEntityGeneral {
  constructor(props) {
    // id печі
    if (props.id) {
      this.id = props.id;
    } else {
      throw new Error(
        "Field 'id' must be defined! \n ===> id = {String}. Using like: local folder name + entity.baseUrl"
      );
    }
    // заголовок для логування
    this.ln = this.id + "::";
    let trace = 1,
      ln = this.ln + "ClassEntityGeneral::constructor::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    // коротка назва
    if (props.shortName && props.shortName.ua) {
      this.shortName = props.shortName;
    } else {
      throw new Error("shortName must be defined!");
    }

    // повна назва
    this.fullName =
      props.fullName && props.fullName.ua ? props.fullName : this.shortName;

    // домашня директорія
    this.homeDir = props.homeDir ? props.homeDir : __dirname;

    // домашня URL адреса виробу
    this.homeUrl = (props.baseUrl ? props.baseUrl : "") + "/entity/" + this.id;

    // ------  менеджер приладів ----------
    this.devicesManager = new ClassDevicesManager({ baseUrl: this.homeUrl });

    // ------  менеджер логування ----------
    this.loggerManager = new ClassLoggerManager({
      ln: this.id + "::loggerManager()::",
      baseUrl: this.homeUrl,
      baseDir: this.homeDir,
      period: test ? 2 * 1000 : 10 * 1000,
      regs: [],
    });

    // ------  менеджер завдань ----------
    this.tasksManager = new TasksManager({
      ln: this.id + "::TasksManager::",
      homeDir: this.homeDir,
      homeURL: this.homeUrl,
    });
    // ------------- processManager -----------------
    this.processManager = new ClassProcessManager({
      homeDir: this.homeDir,
      homeUrl: this.homeUrl,
      tasksManager: this.tasksManager,
      loggerManager: this.loggerManager,
      devicesManager: this.devicesManager,
      ln: this.id + "::ProcessManager::",
    });
  } // constructor
}

module.exports = ClassEntityGeneral;
