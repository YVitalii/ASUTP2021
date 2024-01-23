class ClassRegister {
  constructor(props = {}) {
    /** Ідентифікатор  */
    if (!props.id) {
      new Error("id регістру має бути вказаний");
      return;
    }

    // логер
    this.log = require("../../tools/log");

    // ідентифікатор
    this.id = props.id;
    this.ln = "ClassRegister(" + props.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";

    /** Заголовок */
    this.header = props.header
      ? props.header
      : { ua: "Заголовок", en: "Header", ru: "Заглавие" };

    /** Тип регістру */
    if (!props.type) {
      throw new Error(
        ln +
          "Тип регістру має бути вказаний, але: " +
          `props.type=${props.type}`
      );
    }
    this.type = props.type;

    /** Поточне значення */
    this.value = undefined;
    if (props.value || props.value === 0 || props.value === "") {
      this.setValue(props.value);
    }

    /** Додатковий опис */
    this.comment = props.comment
      ? props.comment
      : {
          ua: "Немає опису",
          en: "Note not defined",
          ru: "Описания нет",
        };

    // дозвіл на редагування регістру
    this.editable = props.editable ? props.editable : true;
  } // constructor

  getValue() {
    return this.value;
  }

  setValue(val) {
    let trace = 1,
      ln = this.ln + `setValue(${val})`;
    this.value = val;

    return this.value;
  }
}

module.exports = ClassRegister;
