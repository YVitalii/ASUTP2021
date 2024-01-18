// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент вибору
 *
 */
tasks.createStep = class ClassCreateStep {
  /**
   * Створює контейнер з регістрами
   * @param {*} props
   * @property {DOMnode} props.container - DOM контенер в якому буде розміщено крок
   * @property {String} props.prefix - префікс до id елемента
   * @property {Object} props.reg - регістр, що містить в собі крок
   * @property {Object} props.types - список доступних класів, що рендерять елементи
   */

  constructor(props = {}) {
    this.ln = "ClassCreateStep(" + props.reg.id + ")::";

    let trace = 1,
      ln = this.ln + "Constructor()::";

    //
    if (!props.reg) {
      throw new Error(ln + "No item 'props.reg' defined");
    }
    this.reg = props.reg;
    // prefix
    if (!props.prefix) {
      throw new Error(ln + "No item 'props.prefix' defined");
    }
    this.prefix = props.prefix;

    // створюємо контейнер для кроку
    this.main = document.createElement("div");
    this.main.classList.add("container");
    this.main.classList.add("border");
    this.main.classList.add("border-secondary");
    if (!props.container) {
      throw new Error(ln + "No props.container defined");
    }
    props.container.appendChild(this.main);

    // якщо це список регістрів то створюємо заголовок
    if (this.reg.type == "regsList") {
      let trace = 1;
      let header = document.createElement("div");
      header.classList.add("row");
      let headerCol = document.createElement("div");
      headerCol.classList.add("col");
      let headerTitle = document.createElement("div");
      headerTitle.classList.add("h6");
      headerTitle.innerHTML = this.reg.header[lang];

      if (trace) {
        console.log(ln + `Type "regsList" was found. Created header=`);
        console.dir(header);
      }
      headerCol.appendChild(headerTitle);
      header.appendChild(headerCol);
      this.main.appendChild(header);
    }

    // створюємо рядок, в якому буде розташовуватися вміст
    let row = document.createElement("div");
    row.classList.add("row");
    row.id = props.prefix;
    this.main.appendChild(row);
    this.container = row;

    // рендеримо дітей
    this.children = new tasks.ClassRegsList({
      prefix: this.prefix,
      container: this.container,
      //parent: this,
      regs: this.reg.regs,
      types: props.types,
    });
    // console.log("------ getValues -------");
    // console.log(this.children.getValues());

    if (trace) {
      console.log(ln + `this=${""}`);
      console.dir(this);
    }
  }

  // onchange(event) {}
  getValues() {
    let res = {};
    res["id"] = this.reg.id;
    return Object.assign(res, this.children.getValues());
  }

  setValues(values) {
    let trace = 1,
      ln = this.ln + `setValues()::`;
    trace ? console.log(ln + `Started`) : null;
    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        trace ? console.log(ln + `for(key=${key})=${values[key]}`) : null;
        this.children.setRegister(key, values[key]);
      } // if (value.hasOwnProperty(key))
    } //for
  }
}; // ClassCreateStep

trace = beforeTrace;
