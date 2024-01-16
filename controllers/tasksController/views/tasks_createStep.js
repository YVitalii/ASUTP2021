// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент вибору
 *
 */
class ClassCreateStep {
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
    this.types = props.types;
    //
    if (!props.reg) {
      throw new Error(ln + "No props.reg defined");
    }
    this.reg = props.reg;

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
        console.log(ln + `headerTitle=`);
        console.dir(headerTitle);
      }
      if (trace) {
        console.log(ln + `headerCol=`);
        console.dir(headerCol);
      }
      if (trace) {
        console.log(ln + `header=`);
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

    // список дітей, що створюються
    this.children = {};

    // -- початкова ініціалізація -----------
    this.renderRegs();
    // this.value = this.getValue();
    // trace ? console.log(ln + `this.value=${this.value}`) : null;
    // this.setValue(this.value);
    // this.renderRegs(this.regs[this.value]);
    if (trace) {
      console.log(ln + `this=${""}`);
      console.dir(this);
    }
  }

  onchange(event) {}

  renderRegs() {
    let reg = this.reg;
    let trace = 1,
      ln = this.ln + `renderRegs(${reg.id})::`;
    trace ? console.log(ln + `Started`) : null;
    this.children = {};
    if (reg.type == "regsList") {
      // якщо це список регістрів - то розкриваємо
      for (let key in reg.regs) {
        if (reg.regs.hasOwnProperty(key)) {
          let trace = 1;
          let item = reg.regs[key];
          trace
            ? console.log(
                ln +
                  `for (key=${key}) item.id= ${item.id}; item.type=${item.type} )`
              )
            : null;

          if (this.types[item.type]) {
            let el = new this.types[item.type]({
              prefix: this.prefix,
              reg: item,
              container: this.container,
            });

            this.container.appendChild(el.div);
            this.children[el.id] = el;
            trace
              ? console.log(ln + `Created element DOM id= ${el.elId} )`)
              : null;
          } //if
        }
      } //for
      return;
    } //if (reg.type == 'regsList')

    if (this.types[reg.type]) {
      let el = new this.types[reg.type]({
        prefix: this.prefix,
        reg: reg,
        container: this.container,
      });
      this.container.appendChild(el.div);
      this.children.push(el);
      trace
        ? console.log(ln + `this.children.length=${this.children.length}`)
        : null;
    }
  }
}
tasks.createStep = ClassCreateStep;

trace = beforeTrace;
