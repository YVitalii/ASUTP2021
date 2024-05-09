/**
 * Базовий клас, від нього наслідуються всі регістри
 * Забеспечує загальну для всіх регістрів функціональність
 */

class ClassRegister {
  /**
   * --- Конструктор
   * @param {Object} props
   * @property {String} props.id - ідентифікатор (імя) регістру, наприклад 'tT' 'regMode'
   * @property {String} props.ln - заголовок повідомлення для запису подій логування (файл та консоль)
   * @property {String} props.type - тип регістру (для побудови елементу в браузері)
   * @property {Number|String} props.value=undefined - значення регістру
   * @property {Object} props.header - багатомовний заголовок регістру ={ ua:`` , en: ``, ru: `` };
   * @property {Object} props.comment - багатомовна примітка-опис регістру ={ ua:`` , en: ``, ru: `` };
   * @property {Boolean} props.editable=true - дозволяє/забороняє редагування регістру в браузері
   */

  constructor(props = {}) {
    /** Ідентифікатор  */

    if (!props.id) {
      new Error("id регістру має бути вказаний");
      return;
    }
    // ідентифікатор
    this.id = props.id;

    // логер
    this.log = require("../../tools/log");

    // заголовок для логів
    this.ln = props.ln ? props.ln : "ClassRegister(" + props.id + ")::";

    let trace = 1,
      ln = this.ln + "constructor()::";

    /** Заголовок */
    this.header = props.header
      ? props.header.ua
        ? props.header
        : {
            ua: "Невірний формат header",
            en: "Bad format header",
            ru: "Неправильный формат заглавия",
          }
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
    this.editable = props.editable === undefined ? true : props.editable;
    // додаткові налаштування для HTML елементів повинні бути не тут
    // this.attributes = props.attributes;
    // this.classes = props.classes;
  } // constructor

  getValue() {
    return this.value;
  }

  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})`;
    this.value = val;
    return this.value;
  }
}

module.exports = ClassRegister;
