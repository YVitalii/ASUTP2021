// -----------  element: select -------------------
beforeTrace = trace;
trace = 0;

/**
 * Створює елемент вибору select
 *
 */
myElementsRender["select"] = class ClassElementSelectRegsList extends (
  myElementsRender.selectGeneral
) {
  constructor(props = {}) {
    super(props);
    this.ln = "ClassElementSelectRegsList(" + props.reg.id + ")::";
    let trace = 0,
      ln = this.ln + "Constructor()::";
    //debugger;
    // create children
    this.children = new tasks.ClassRegsList({
      container: this.container,
      prefix: this.elId,
      regs: this.regs[this.value].regs,
      types: this.types,
      afterChange: this.afterChange,
    });

    // рендерим
    this.setValue(this.value);

    if (trace) {
      console.log(ln + `this.getFieldValue()=${this.getFieldValue()}`);
      console.dir(this);
    }
  }

  onchange(event) {
    let ln = this.ln + "onchange()::elem_select()::";
    let trace = 0;
    if (!this.hasChanged()) {
      return;
    }
    this.setValue(this.getFieldValue());
    super.onchange(event);
  }

  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    super.setValue(val);
    this.children.remove();
    this.children.render(this.regs[val].regs);
  }
};

trace = beforeTrace;
