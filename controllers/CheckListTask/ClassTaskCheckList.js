const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral.js");
const ClassStepCheckList = require("./ClassStepCheckList.js");
const myError = require("../../tools/myError.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");
class ClassTaskCheckList extends ClassTaskGeneral {
  constructor(props = {}) {
    let trace = 1,
      ln = `ClassTaskCheckList::constructor::${props.id}::`;
    let params = {
      id: "taskCheckList",
      ln: props.ln ? props.ln : "ClassTaskCheckList::",
      header: props.header
        ? props.header
        : { ua: `Перелік дій`, en: `Action list`, ru: `Список действий` },
      comment: props.comment
        ? props.comment
        : { ua: `Дії користувача`, en: ``, ru: `` },

      type: "checkList",
    };
    super(params);
    // адреса за якою буде спілкування з клієнтом
    this.homeUrl =
      props.homeUrl || props.homeURL != ""
        ? props.homeUrl
        : new myError({
            ua: `Не вказано homeUrl`,
            en: `homeUrl not specified`,
            ru: `Не указано homeUrl`,
          });
    // файлова адреса збереження чеклистів задач, отримуємо з tasksManager
    this.homeDir =
      props.homeDir || props.homeDir != ""
        ? props.homeDir
        : new myError({
            ua: `Не вказано homeDir`,
            en: `homeDir not specified`,
            ru: `Не указано homeDir`,
          });
    this.homeDir = resolve(this.homeDir, "checkListsTasks");
    // тут буде зберігатись вміст завдання в форматі markdown
    this.content = "";
  } // constructor
  getStep(regs) {
    let trace = 1,
      ln = this.ln + `getStep::`;
  }
} // class ClassTaskCheckList

module.exports = ClassTaskCheckList;
