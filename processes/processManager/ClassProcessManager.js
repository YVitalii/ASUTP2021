/** Керує процесом */
const pug = require("pug");
const path = require("path");
const log = require("../../tools/log");

class ClassProcessManager {
  constructor(props = {}) {
    this.homeUrl = props.homeUrl ? props.homeUrl + "processManager/" : "/";
    this.homeDir = props.homeDir ? props.homeDir + "processManager\\" : "/";

    this.ln = props.ln ? props.ln : `ClassProcessManager(${this.homeUrl})::`;
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `Started with props=`);
      console.dir(props);
    }
    if (!props.tasksManager) {
      throw new Error(this.ln + "TasksManager must be defined!! ");
    }
    this.tasksManager = props.tasksManager;

    this.moduleDir = __dirname;
  }
  setProgram() {
    this.program = [];
  }
  getFullHtml(props = {}) {
    let trace = 1,
      ln = this.ln + "getFullHtml()::";
    if (trace) {
      log("i", ln, `Started with props=`);
      console.dir(props);
    }
    let lang = props.lang ? props.lang : "ua";
    let template = path.resolve(__dirname + "/views/procMan_full.pug");
    trace ? log("i", ln, `template=`, template) : null;
    let html = pug.renderFile(template, { processMan: this });
    return html;
  }
}

module.exports = ClassProcessManager;
