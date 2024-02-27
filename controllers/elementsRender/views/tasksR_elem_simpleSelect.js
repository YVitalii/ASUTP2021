// -----------  element: simpleSelect -------------------
beforeTrace = trace;
trace = 1;

/**
 * Створює елемент вибору простого вибору зі списку select
 * без створення/видалення дітей
 */
tasks.elementsTypes["simpleSelect"] = class ClassElementSimpleSelect extends (
  tasks.ClassCreateElement
) {
  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSimpleSelect(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";

    if (!Array.isArray(this.reg.list)) {
      console.error(this.ln + "Invalid list item");
    }
    // створюємо список <option>
    let keys = "";
    for (let i = 0; i < this.reg.list.length; i++) {
      let trace = 1;
      let selected = "";
      if (keys == this.value) {
        selected = "selected";
      }
      trace ? console.log(ln + "key=" + key) : null;
      keys += `<option value='${key}' ${selected}> ${this.reg.list[i]} </option>`;
    } //for

    // -- опції вибору -------
    this.field.innerHTML = keys;

    // -- початкова ініціалізація -----------
    this.value = this.getFieldValue();
    trace ? console.log(ln + `this.value=${this.value}`) : null;

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
    // super.setValue(val);
    // this.children.remove();
    // this.children.render(this.regs[val].regs);
  }
};

trace = beforeTrace;
