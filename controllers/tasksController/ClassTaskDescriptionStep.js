const ClassReg_regsList = require("../regsController/ClassReg_regsList.js");
const ClassRegister = require("../regsController/ClassRegister.js");
const clone = require("clone");

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
          value: props.name ? props.name : "empty",
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
          value: props.note ? props.note : "empty",
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

  getState() {
    let trace = 0,
      ln = this.ln + "getState()::";
    if (trace) {
      this.log("i", ln, `this=`);
      console.dir(this);
    }
    let res = {
      id: this.id,
      type: this.id,
      header: this.header,
      comment: {
        ua: `${this.regs.note.value}`,
        en: `${this.regs.note.value}`,
        ru: `${this.regs.note.value}`,
      },
      value: this.regs.name.value,
      editable: false,
    };
    return res;
  }

  getStep(regs) {
    this.regs.name.value = regs.name;
    this.regs.note.value = regs.note;
    // let res = this.getState();
    // res.type = "description";
    return this;
  }

  /**
   * Повертає копію this.reg для рендерингу сторінки
   * видаляє непотрібні поля devices
   */
  getRegForHtml() {
    return clone(this);
  }
}

module.exports = ClassTaskDescriptionStep;
