const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral.js");
const myError = require("../../tools/myError.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");
class ClassTaskCheckList extends ClassTaskGeneral {
  constructor(props) {
    let trace = 1,
      ln = `ClassTaskCheckList::constructor::${props.id}::`;
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Виконання перевірочного списку`,
          en: `Execution of the check list`,
          ru: `Выполнение проверочного списка`,
        };
    props.header = props.header
      ? props.header
      : {
          ua: `Перевірочний список`,
          en: `Check List`,
          ru: `Проверочный список`,
        };
    super(props);
    this.homeUrl =
      props.homeUrl || props.homeURL != ""
        ? props.homeUrl
        : new myError({
            ua: `Не вказано homeUrl`,
            en: `homeUrl not specified`,
            ru: `Не указано homeUrl`,
          });

    this.homeDir =
      props.homeDir || props.homeDir != ""
        ? props.homeDir
        : new myError({
            ua: `Не вказано homeDir`,
            en: `homeDir not specified`,
            ru: `Не указано homeDir`,
          });
    this.homeDir = resolve(this.homeDir, "checkListsTasks");
    let tasks = readFileSync(
      resolve(this.homeDir, "tasksManager/checkLists"),
      "utf-8"
    );
    this.state.tasks = JSON.parse(tasks);
    trace ? this.logger("i", ln, `Created CheckListClass ${this.id}`) : null;
  }
} // class ClassTaskCheckList

module.exports = ClassTaskCheckList;
