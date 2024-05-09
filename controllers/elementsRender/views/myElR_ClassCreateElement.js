myElementsRender["ClassCreateElement"] = class ClassCreateElement extends (
  myElementsRender.ClassGeneralElement
) {
  /**
   * Створює налаштований DOM-елемент загального типу
   * @param {Object} props
   * @property {string} props.tag - тип елементу (number, range, select)
   * //@property {Function} props.onchange  - додаткова локальна функція обробки події
   * @property {Object} props.container - контейнер в якому потрібно розмістити елемент
   */
  constructor(props = {}) {
    props.ln = props.ln ? props.ln : "ClassCreateElement()::";
    super(props);

    let trace = 1,
      ln = this.ln + "constructror()::";
    trace ? console.log(ln + "props=") : null;
    trace ? console.dir(props) : null;

    // -- тег основного елемента, щоб створити шаблон
    this.tag = props.tag;

    // поточне значення
    this.value = props.reg.value;
    this.beforeValue = props.reg.value;
    // -- id - елементу DOM
    this.elId = this.prefix + "__" + this.id; //два підкреслення (щоб легко відділяти id регістру)
    // контейнер для всього елементу
    this.div = document.createElement("div");
    this.div.id = this.elId;
    this.div.classList.add("col");
    this.div.classList.add("form-group");

    // ---- <comment> --------
    if (this.reg.comment && this.reg.comment[lang]) {
      this.comment = document.createElement("small");
      this.comment.innerHTML = this.reg.comment[lang];
    } else {
      this.comment = undefined;
    }

    // ---- Field --------
    this.field = document.createElement(this.tag);
    this.field.classList.add("form-control");
    this.field.classList.add(this.prefix);
    this.field.classList.add("field");
    this.field.id = this.elId + "_field";
    if (typeof props.attributes == "object") {
      this.setAtributes(this.field, props.attributes);
    }
    if (typeof props.classes == "object") {
      this.setClassList(this.field, props.classes);
    }
    if (!this.editable) {
      this.setAtributes(this.field, { readonly: "true" });
    }
    // ---- <label=header> --------
    this.label = document.createElement("label");
    this.label.setAttribute("for", this.field.id);
    this.label.classList.add("h6");
    this.label.innerHTML = this.reg.header[lang];
    // ---- зв'язуємо разом ----------
    this.div.appendChild(this.label);
    this.div.appendChild(this.field);
    if (this.comment) {
      this.div.appendChild(this.comment);
    }
    // -- поточне значення -----
    if (props.reg.value | (props.reg.value === 0)) {
      this.value = props.reg.value;
      this.beforeValue = props.reg.value;
      this.setValue(this.value);
    }
    // додаємо в контейнер елемент
    this.container.appendChild(this.div);
    // привязуємо this до обробника до this
    this.field.onchange = this.onchange.bind(this);
  }

  onchange(event) {
    let trace = 0;
    let ln = this.ln + "onchange()::";
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
    trace ? console.log(ln + "this.field.value=" + this.field.value) : null;
  }

  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    trace
      ? console.log(ln + `Started:this.beforeValue=${this.beforeValue}`)
      : null;
    trace = 0;
    this.value = val;
    this.beforeValue = this.value;
    trace
      ? console.log(
          ln +
            `Finished:this.beforeValue=${this.beforeValue};this.value=${this.value}`
        )
      : null;
    this.field.value = val;
    this.reg.value = val;
    //this.afterChange(this);
  }
  // /** встановлює атрибути елемента Field */
  // setProperties(el = "field", obj = {}) {
  //   //let el;

  //   console.log(this.ln + `setProperty[${key}]=${value}. Поки не реалізовано!`);
  // }

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
        : this.field.value != this.beforeValue;
    trace
      ? console.log(
          ln +
            `this.beforeValue=${this.beforeValue};this.field.value=${this.field.value}; res=${res}`
        )
      : null;
    return res;
  }
  /** Повертає значення з DOM елементу field */
  getFieldValue() {
    return this.field.value;
  }
  getValue() {
    return this.value;
  }
};
