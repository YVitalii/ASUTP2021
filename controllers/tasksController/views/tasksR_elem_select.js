// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент вибору
 *
 */
class ClassElementSelect extends ClassCreateElement {
  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSelect(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";
    this.regs = this.reg.regs;
    this.children = []; // список дітей, що створюються при виборі варіанту
    // створюємо список <option>
    let keys = "";
    let first = true;
    for (let key in this.regs) {
      if (this.regs.hasOwnProperty(key)) {
        let trace = 1;
        let selected = "";
        // якщо this.value не вказано, то перший елемент в списку опцій обирається автоматично браузером
        if (!first & (keys == this.value)) {
          selected = "selected";
          //   // якщо це перша опція, вибираємо її як початкову
          //   this.setValue(field.value = key;
          //   this.field.dataset.beforeValue = key;
        }
        trace ? console.log(ln + "key=" + key) : null;
        keys += `<option value='${key}' ${selected}> ${this.reg.regs[key].header[lang]} </option>`;
      }
    } //for
    // -- опції вибору -------
    this.field.innerHTML = keys;
    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange.bind(this);
    // -- початкова ініціалізація -----------

    this.value = this.getValue();
    trace ? console.log(ln + `this.value=${this.value}`) : null;
    this.setValue(this.value);
    this.renderRegs(this.regs[this.value]);
    if (trace) {
      console.log(ln + `this.getValue()=${this.getValue()}`);
      console.dir(this);
    }
  }

  onchange(event) {
    let trace = 1,
      ln = this.ln + "onchange()::";
    if (!this.hasChanged()) {
      return;
    }
    let beforeRegs = this.regs[this.getBeforeValue()].regs;
    trace
      ? console.log(ln + `this.regs[${this.getBeforeValue()}]=${beforeRegs}`)
      : null;
    this.deleteBeforeRegs(beforeRegs);
    super.onchange(event);
    let reg = this.regs[this.getValue()];
    this.renderRegs(reg);
    this.setValue(reg.id);
  }

  // ----- видаляємо поля попереднього вибору ----------
  deleteBeforeRegs() {
    let trace = 1,
      ln = this.ln + "deleteBeforeRegs()::";
    trace
      ? console.log(ln + `Started! children=${JSON.stringify(this.children)}`)
      : null;
    for (let i = 0; i < this.children.length; i++) {
      let child = this.children[i];
      if (child.type == "select") {
        console.log(ln + "element Select found");
        child.deleteBeforeRegs();
      }
      let el = document.getElementById(child.elId);
      if (el) {
        el.remove();
      }

      trace ? console.log(ln + `child.elId=${child.elId}`) : null;
    } // for
    this.children = [];
  }

  renderRegs(reg) {
    let trace = 1,
      ln = this.ln + `renderRegs(${reg.id})::`;
    trace ? console.log(ln + `Started`) : null;
    this.children = [];

    // if (this.beforValue == this.value) {
    //   console.log(this.id+"::"+"Значення не змінилося")
    // }
    for (let key in reg.regs) {
      if (reg.regs.hasOwnProperty(key)) {
        let trace = 1;

        let item = reg.regs[key];
        trace
          ? console.log(ln + `for (key=${key}) item.id= ${item.id} )`)
          : null;
        //let itemHidden = document.getElementById(item)
        if (tasks.elementsTypes[item.type]) {
          let el = new tasks.elementsTypes[item.type]({
            prefix: this.prefix,
            reg: item,
            container: this.container,
          });

          this.container.appendChild(el.div);

          trace
            ? console.log(ln + `Created element DOM id= ${el.elId} )`)
            : null;
          this.children.push(el);
        }
      }
    } //for
    trace
      ? console.log(ln + `this.children.length=${this.children.length}`)
      : null;
  }
}

tasks.elementsTypes["select"] = ClassElementSelect;

trace = beforeTrace;
