class ClassRegister {
  constructor(props = {}) {
    /** Ідентифікатор  */
    this.id = props.id ? props.id : new Error("id регістру має бути вказаний");
    this.ln = "ClassRegister(" + props.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** Заголовок */
    this.header = props.header
      ? props.header
      : { ua: "Заголовок", en: "Header", ru: "Заглавие" };
    /** Тип регістру */
    this.type = props.type
      ? props.type
      : new Error(ln + "Тип регістру має бути вказаний");
    /** Поточне значення */
    this.value = props.value | (props.value === 0) ? props.value : null;
    /** Додатковий опис */
    this.comment = props.comment
      ? props.comment
      : {
          ua: "Немає опису",
          en: "Note not defined",
          ru: "Описания нет",
        };

    /** Місце для зберігання внутрішніх регістрів */
    this.regs = {};
  } // constructor
}

module.exports = ClassRegister;
