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
      ln = "ClassElementSelect()::";
    this.regs = this.reg.regs;

    // створюємо список <option>
    let keys = "";
    for (let key in this.regs) {
      if (this.regs.hasOwnProperty(key)) {
        let trace = 1;
        // if (keys == "") {
        //   // якщо це перша опція, вибираємо її як початкову
        //   this.setValue(field.value = key;
        //   this.field.dataset.beforeValue = key;
        // }
        trace ? console.log(ln + "key=" + key) : null;
        keys += `<option value='${key}'> ${this.reg.regs[key].header[lang]} </option>`;
      }
    } //for
    // -- опції вибору -------
    this.field.innerHTML = keys;
    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange.bind(this);

    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  onchange(event) {
    let trace = 1,
      ln = this.ln + "onchange()::";
    super.onchange(event);
    let reg = this.regs[this.getValue()];
    this.parseRegs(reg);
  }
  parseRegs(reg) {
    let trace = 1,
      ln = this.ln + `parseRegs(${reg.id})::`;
    trace ? console.log(ln + `Started`) : null;

    for (let key in reg.regs) {
      if (reg.regs.hasOwnProperty(key)) {
        let trace = 1;
        trace ? console.log(ln + "for (key=" + key + ")::") : null;
        let item = reg.regs[key];
        if (tasks.elementsTypes[item.type]) {
          let el = new tasks.elementsTypes[item.type]({
            prefix: this.prefix,
            reg: item,
            container: this.container,
          });
          this.container.appendChild(el.div);
        }
      }
    } //for
  }
}

tasks.elementsTypes["select"] = ClassElementSelect;

trace = beforeTrace;
