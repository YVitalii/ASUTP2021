// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

/**
 * Створює елемент вибору select
 *
 */
class ClassElementSelect extends tasks.ClassCreateElement {
  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSelect(" + props.reg.id + ")::";
    let trace = 0,
      ln = this.ln + "Constructor()::";
    this.regs = this.reg.regs;

    // створюємо список <option>
    let keys = "";
    let first = true;
    for (let key in this.regs) {
      if (this.regs.hasOwnProperty(key)) {
        let trace = 0;
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
    // this.field.onchange = this.onchange.bind(this);
    // -- початкова ініціалізація -----------
    this.value = this.getFieldValue();
    trace ? console.log(ln + `this.value=${this.value}`) : null;

    // create children
    this.children = new tasks.ClassRegsList({
      container: this.container,
      prefix: this.elId,
      regs: this.regs[this.value].regs,
      types: this.types,
    });

    this.setValue(this.value);

    if (trace) {
      console.log(ln + `this.getFieldValue()=${this.getFieldValue()}`);
      console.dir(this);
    }
  }

  onchange(event) {
    let ln = this.ln + "onchange()::elem_select()::";
    let trace = 1;
    if (!this.hasChanged()) {
      return;
    }
    // this.children.remove();
    // this.render(this.regs[this.getFieldValue()]);
    this.setValue(this.getFieldValue());
    super.onchange(event);
  }

  setValue(val) {
    let trace = 1,
      ln = this.ln + `setValue(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    super.setValue(val);
    this.children.remove();
    this.children.render(this.regs[val].regs);
  }
}

tasks.elementsTypes["select"] = ClassElementSelect;

trace = beforeTrace;
