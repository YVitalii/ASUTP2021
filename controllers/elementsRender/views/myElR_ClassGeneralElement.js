myElementsRender["ClassGeneralElement"] = class ClassGeneralElement {
  /**
   * Створює заготовку об'єкту загального типу
   * @param {Object} props
   * @property {string} props.id -  id елементу
   * @property {string} props.prefix - префікс для id елементу
   * @property {Object} props.reg  - типовий регістр з описом елементу
   * @property {Object} props.container - контейнер в якому потрібно розмістити елемент
   * @property {String} props.type - тип елементу (ключ в  myElementsRender)
   * @property {async Function} props.afterChange - зовнішня функція, що запускається після зміни значення
   */
  constructor(props = {}) {
    this.ln = props.ln ? props.ln : undefined;

    let trace = 0,
      ln = this.ln + "constructror()::";

    trace ? console.log(ln + "props=") : null;
    trace ? console.dir(props) : null;
    // -- батьківський контейнер для елементу -----
    if (!props.container) {
      console.error(ln + "Не вказано батьківський контейнер!!!");
    } else {
      this.container = props.container;
    }
    // -- id -----
    this.id = props.reg.id
      ? props.reg.id
      : "id" + new Date().getTime().toString().slice(-8);
    // -- префікс -----

    this.prefix = props.prefix ? props.prefix : this.id + "_";

    // -- регістр з загальним описом елементу

    this.reg = props.reg;

    // тип регистру

    this.type = props.reg.type;

    // дозвіл на зміну значення

    this.editable =
      props.reg.editable === undefined ? true : props.reg.editable;

    // зовнішня функція для обробки події зміни значення
    // запускається коли значення змінилося
    if (typeof props.afterChange === "function") {
      this.afterChange = props.afterChange.bind(this);
    } else {
      this.afterChange = async (el = {}) => {
        let trace = 1,
          ln = el.ln + "afterChange()::";
        if (trace) {
          console.log(ln + `this.value=`);
          console.dir(this.value);
        }
        return 0;
      };
    }
  } //constructor

  /**
   * Додає до елементу класи, вказані в classList
   * @param {*} el - елемент до якого застосовуються класи
   * @param {Array | String} classList - масив класів або рядок з розділовими пробілами
   */

  setClassList(el, classList) {
    if (typeof classList === "string") {
      classList = classList.split(" ");
    }
    if (!Array.isArray(classList)) {
      console.error(
        "ClassGeneralElement.setClassList must be Array! classList=" +
          `${classList}`
      );
      return;
    }
    for (var i = 0; i < classList.length; i++) {
      el.classList.add(classList[i]);
    }
  } //setClassList

  /**
   * Додає до елементу атрибути, вказані в atributesList
   * @param {*} el - елемент до якого застосовуються атрибути
   * @param {Object} list - об'єкт з атрибутами елементу {enable:"true", ..}
   */
  setAtributes(el, list = {}) {
    if (typeof list != "object") {
      console.error(
        "ClassGeneralElement.setAttributes() must be Object! But list=" +
          `${list}`
      );
      return;
    }
    for (let key in list) {
      if (list.hasOwnProperty(key)) {
        el.setAttribute(key, list[key]);
      }
    }
  } //setAtributes
};
