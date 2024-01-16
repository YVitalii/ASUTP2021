class ClassCreateElement {
  /**
   * Створює налаштований DOM-елемент загального типу
   * @param {Object} props
   * @property {string} props.prefix - префікс для id елементу
   * @property {string} props.tag - тип елементу (number, range, select)
   * @property {Object} props.reg  - типовий регістр
   * @property {Object} props.container - контейнер в якому потрібно розмістити елемент
   */
  constructor(props = {}) {
    this.ln = "ClassCreateElement()::";
    let trace = 1,
      ln = this.ln + "constructror()::";
    trace ? console.log(ln + "props=") : null;
    trace ? console.dir(props) : null;
    // -- батьківський контейнер для елементу -----
    if (!props.container) {
      console.error(ln + "Не вказано батьківський контейнер!!!");
    } else {
      this.container = props.container;
    }
    // -- тег основного елемента, щоб створити шаблон
    this.tag = props.tag;
    // -- префікс -----
    this.prefix = props.prefix;
    // -- id -----
    this.id = props.reg.id;
    // -- регістр
    this.reg = props.reg;
    // тип регистру
    this.type = props.reg.type;

    // дозвіл на зміну значення
    this.readonly = props.reg.readonly;

    this.value = props.reg.value;
    this.beforeValue = props.reg.value;
    // -- id - елементу DOM
    this.elId = this.getElId();
    // контейнер для всього елементу
    this.div = document.createElement("div");
    this.div.id = this.getElId();
    this.div.classList.add("col");
    this.div.classList.add("form-group");
    // ---- <label=header> --------
    this.label = document.createElement("label");
    this.label.setAttribute("for", this.id);
    this.label.classList.add("h6");
    this.label.innerHTML = this.reg.header[lang];
    // ---- <comment> --------
    this.comment = document.createElement("small");
    this.comment.innerHTML = this.reg.comment[lang];
    // ---- Field --------
    this.field = document.createElement(this.tag);
    this.field.classList.add("form-control");
    this.field.classList.add(this.prefix);
    this.field.id = this.elId + "_field";
    if (this.readonly) {
      this.field.classList.add("readonly");
    }
    this.div.appendChild(this.label);
    this.div.appendChild(this.field);
    this.div.appendChild(this.comment);
    // -- поточне значення -----
    if (props.reg.value | (props.reg.value === 0)) {
      this.value = props.reg.value;
      this.beforeValue = props.reg.value;
      this.setValue(this.value);
    }
    this.container.appendChild(this.div);
  }

  onchange(event) {
    let ln = this.ln + "onchange()::";
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
    trace ? console.log(ln + "this.field.value=" + this.getValue()) : null;
    //this.setValue(this.getValue());
  }

  // створює ідентифікатор для елементу DOM
  getElId(id = null) {
    id = id === null ? this.id : id;
    return this.prefix + "__" + id; //два підкреслення (щоб легко відділяти id регістру)
  }

  setValue(val) {
    let trace = 1,
      ln = this.ln + `setValue(${val})`;
    trace
      ? console.log(
          ln +
            `Started:this.beforeValue=${this.beforeValue};this.value=${this.value}`
        )
      : null;
    this.beforeValue = this.value;
    this.value = val;
    trace
      ? console.log(
          ln +
            `Finished:this.beforeValue=${this.beforeValue};this.value=${this.value}`
        )
      : null;
    //this.field.value = val;
  }

  getBeforeValue() {
    return this.beforeValue;
  }

  /**
   * @return true якщо елемент змінився
   */

  hasChanged() {
    let trace = 1,
      ln = this.ln + "hasChanged()::";

    let res;
    res =
      this.beforeValue == undefined
        ? true
        : this.getValue() != this.getBeforeValue();
    trace
      ? console.log(
          ln +
            `this.getBeforeValue()=${this.getBeforeValue()};this.getValue()=${this.getValue()}; res=${res}`
        )
      : null;
    return res;
  }

  getValue() {
    return this.field.value;
  }
}
