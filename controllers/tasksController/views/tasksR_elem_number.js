// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент вибору
 *
 */
class ClassElementNumber extends ClassCreateElement {
  constructor(props = {}) {
    props.tag = "input";
    super(props);
    this.ln = "ClassElementNumber(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";

    // -- опції вибору -------
    //this.field.innerHTML = keys;
    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange.bind(this);
    this.field.setAttribute("type", "number");

    if (props.reg.min | (props.reg.min === 0)) {
      this.field.setAttribute("min", props.reg.min);
      this.min = props.reg.min;
    }
    if (props.reg.max | (props.reg.max === 0)) {
      this.field.setAttribute("max", props.reg.max);
      this.max = props.reg.max;
    }
    this.field.setAttribute("value", props.reg.value);
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  onchange(event) {
    let trace = 1,
      ln = this.ln + "onchange()::";
    super.onchange(event);
    let val = this.getValue();
    if (val > this.max) {
      val = this.max;
    }
    if (val < this.min) {
      val = this.min;
    }
    this.setValue(val);
    this.field.value = this.value;
  }
}

tasks.elementsTypes["number"] = ClassElementNumber;

trace = beforeTrace;