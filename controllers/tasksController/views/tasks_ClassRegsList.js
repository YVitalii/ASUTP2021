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
    let trace = 0,
      ln = this.ln + "сonstructor()::";
    //
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }

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
      props.regs = {};
      throw new Error(ln + "'props.regs' not defined !!");
    }

    // prefix
    this.prefix = props.prefix ? props.prefix : "undefined_";

    // контейнер DOM, в якому буде розміщено елемент
    if (!props.container) {
      props.container = document.body;
      throw new Error(
        ln + "'props.container' not defined !! Was selected 'document.body' "
      );
    }
    this.container = props.container;

    // список дітей, елементу

    this.children = {};

    // -- початкова ініціалізація -----------
    this.render(props.regs);

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

        let el = document.getElementById(child.div.id);
        if (el) {
          el.remove();
        }
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
          // перевіряємо чи є елемент з таким id в DOM
          if (document.getElementById(el.idEl)) {
            throw Error(
              ln + `DOM element with id = ${el.idEl} already presented!!`
            );
          }
          // додаємо в дерево DOM
          this.container.appendChild(el.div);
          // запамятовуємо в списку дітей
          this.children[el.id] = el;
          trace
            ? console.log(ln + `Created element DOM id= ${el.elId} )`)
            : null;
        } else {
          console.error(
            ln +
              `Not found in tasks.elementsTypes(=this.types) type: item.type=${item.type}`
          );
        } //if
      } //if (regs.hasOwnProperty(key))
    } // for
    trace
      ? console.log(ln + `Created this.children=${Object.keys(this.children)}`)
      : null;
  } //renderRegs()

  /**
   * Збирає значення регістрів всіх дітей
   * @returns {Object} {reg1.id:reg1.value, reg2.id:reg2.value, } for example {'tT':500,'o':15,..}
   */
  getValues() {
    let trace = 0,
      ln = this.ln + ` getValues(${this.prefix})::`;
    let children = this.children;
    let res = {};
    for (let key in children) {
      if (children.hasOwnProperty(key)) {
        let lln = ln + `for (${key})::`,
          trace = 0;
        let child = children[key];
        if (trace) {
          console.log(lln + `child=`);
          console.dir(child);
        }
        res[child.id] = child.value;
        if (child.children) {
          let resChild = child.children.getValues();
          Object.assign(res, resChild);
        }
      }
    }
    //trace = 1;
    if (trace) {
      console.log(ln + `Response=`);
      console.dir(res);
    }
    return res;
  } //getValues()

  // /**
  //  *
  //  * @param {Object} values - {'tT':500,...} or {'tT':{value:500,enable:true,...},...}
  //  */

  setRegister(id, value) {
    let trace = 0,
      ln = this.ln + `setRegister(${id};${value})::`;
    trace ? console.log(ln + `Started`) : null;
    let reg = this.findRegister(id);
    if (reg) {
      // регістр знайдено
      if (typeof value != "object") {
        reg.setValue(value);
        return value;
      }
      // якщо value - об'экт зі значеннями, то перебираємо ці значення
      for (let key in value) {
        if (value.hasOwnProperty(key)) {
          if (reg[key]) {
            // поле key  в регістрі знайдено
            reg[key].setProperty(key, value[key]);
          }
        } //for
      }
    } // setRegister(id,values)
  }

  /**
   * Знаходить серед дітей регістр з вказаним id
   * @param {String} id
   * @return {undefined | Object }
   */
  findRegister(id) {
    let trace = 0,
      ln = this.ln + `findRegister(${id}})::`;
    trace ? console.log(ln + `Started`) : null;

    let res = this.children[id];

    if (!res) {
      // якщо при прямому пошуку не знайдено
      // шукаємо в регістрах з дітьми
      for (let key in this.children) {
        if (this.children.hasOwnProperty(key)) {
          if (this.children[key].children) {
            res = this.children[key].children.findRegister(id);
            if (res) {
              break;
            }
          }
        }
      } //for
    }
    return res;
  }
}; // Class

trace = beforeTrace;
