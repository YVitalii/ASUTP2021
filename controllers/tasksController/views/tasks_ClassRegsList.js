// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає список об'єктів регістрів та їх DOM - елементи
 *
 */
tasks.ClassRegsList = class ClassRegsList {
  /**
   * Створює контейнер з регістрами
   * @param {*} props
   * @property {DOMnode} props.container - DOM контенер в якому буде розміщено
   * @property {String} props.prefix - префікс до id
   * @property {Object} props.regs - список регістрів
   * @property {Object} props.types - список доступних класів, що рендерять елементи
   */
  #type = "regsList";

  constructor(props = {}) {
    this.ln = `ClassRegsList(${props.prefix})::`;
    let trace = 1,
      ln = this.ln + "сonstructor()::";
    //
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    // тип
    // this.type = "listRegs";
    // об'єкт, що містить в собі список доступних типів (класів) регістрів,
    // що використовуються для їх створення
    if (!props.types) {
      // TODO Виправити костиля. Ймовірно список типів
      // потріпно зберігати у властивостях класу  ClassRegsList.types
      // в цьому разі він буде завжди з цим класом
      props.types = tasks.elementsTypes;
      //throw new Error(ln + "'props.types' not defined !!");
    }
    this.types = props.types;

    // список регістрів
    if (!props.regs) {
      throw new Error(ln + "'props.regs' not defined !!");
      props.regs = {};
    }
    this.regs = props.regs;

    // prefix
    this.prefix = props.prefix ? props.prefix : "undefined_";

    // контейнер DOM, в якому буде розміщено елемент
    if (!props.container) {
      throw new Error(
        ln + "'props.container' not defined !! Was selected 'document.body' "
      );
      props.container = document.body;
    }
    this.container = props.container;

    // список дітей, елементу

    this.children = {};

    // -- початкова ініціалізація -----------
    this.render(this.regs);

    if (trace) {
      console.log(ln + `Was created element. this=${""}`);
      console.dir(this);
    }
  }

  onchange(event) {}

  remove() {
    let trace = 1,
      ln = this.ln + `remove(${this.prefix})::`;
    let regs = this.children;
    for (let key in regs) {
      let lln = ln + `child[${key}]::`;
      trace ? console.log(ln + `key=${key}`) : null;
      if (regs.hasOwnProperty(key)) {
        let child = regs[key];
        document.getElementById(child.div.id).remove();
        trace
          ? console.log(
              lln + `Was removed element from DOM id= ${child.div.id} )`
            )
          : null;
        regs[key] = undefined;
      } //if (regs.hasOwnProperty(key))
    } //for
    this.children = {};
    console.log(ln + "Completed!");
  }
  render(regs) {
    let trace = 1,
      ln = this.ln + `render(${this.prefix})::`;
    trace ? console.log(ln + `Started`) : null;
    trace ? console.log(ln + `regs=${regs}`) : null;
    this.children = {};
    for (let key in regs) {
      trace ? console.log(ln + `key=${key}`) : null;
      if (regs.hasOwnProperty(key)) {
        let trace = 1;
        let item = regs[key];
        trace
          ? console.log(
              ln +
                `for (key=${key}) item.id= ${item.id}; item.type=${item.type} )`
            )
          : null;

        if (this.types[item.type]) {
          // тип регістру визначений, визиваємо його конструктор
          let el = new this.types[item.type]({
            prefix: this.prefix,
            reg: item,
            container: this.container,
          });
          // додаємо в дерево DOM
          this.container.appendChild(el.div);
          // запамятовуємо в списку дітей
          this.children[el.id] = el;
          trace
            ? console.log(ln + `Created element DOM id= ${el.elId} )`)
            : null;
        } //if
      } //if (regs.hasOwnProperty(key))
    } // for
    trace
      ? console.log(ln + `Created this.children=${Object.keys(this.children)}`)
      : null;
  } //renderRegs()
}; // Class

trace = beforeTrace;
