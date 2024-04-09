const ClassReg_regsList = require("../regsController/ClassReg_regsList.js");
const ClassRegister = require("../regsController/ClassRegister.js");

class ClassTaskDescriptionStep extends ClassReg_regsList {
  constructor(props = {}) {
    props = {
      id: "description",
      ln: "tasksDescription::",
      header: {
        ua: "Загальний опис програми",
        en: "General descriptiom of program",
        ru: "Общее описание программы",
      },
      comment: {
        ua: ``,
        en: ``,
        ru: ``,
      },
      editable: false, //крок не можна видаляти/додавати
      regs: {
        // опис поля Ім'я програми
        name: new ClassRegister({
          id: "name",
          type: "text",
          ln: "tasks.description.name::",
          value: "empty",
          header: {
            ua: `Назва програми`,
            en: `Program name`,
            ru: `Название программы`,
          },
          comment: {
            ua: `3..20 символів`,
            en: `3..20 characters`,
            ru: `3..20 символов`,
          },
        }),
        note: new ClassRegister({
          // опис поля примітки для програми
          id: "note",
          type: "textarea",
          ln: "tasks.description.note::",
          value: "empty",
          header: {
            ua: "Примітки",
            en: "Notes",
            ru: "Примечания",
          },
          comment: {
            ua: `Опис програми`,
            en: `Program description`,
            ru: `Описание программы`,
          },
        }),
      },
    };
    super(props);
  } //constructor
  getStep(regs = {}) {
    let trace = 1,
      ln = this.ln + "getStep()::";
    if (trace) {
      this.log("i", ln, `this=`);
      console.dir(this);
    }
    let res = {
      header: this.regs.name.header,
      value: regs.name ? regs.name : "undefined",
      comment: regs.note ? regs.note : "undefined",
      editable: false,
    };
    return res;
  }
}

module.exports = ClassTaskDescriptionStep;
