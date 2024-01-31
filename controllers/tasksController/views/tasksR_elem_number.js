// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент вибору
 *
 */
class ClassElementNumber extends tasks.ClassCreateElement {
  constructor(props = {}) {
    props.tag = "input";
    super(props);
    this.ln = "ClassElementNumber(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";

    // -- тип поля Number -------
    this.field.setAttribute("type", "number");

    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange.bind(this);

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
    let val = this.getFieldValue();
    this.setValue(val);
    //this.field.value = this.value;
  } // onchange()

  setValue(val) {
    if (val > this.max) {
      console.error(
        this.ln +
          `Can't set ${val}, because max=${this.max}. Was setted max value!`
      );
      val = this.max;
    }
    if (val < this.min) {
      val = this.min;
      console.error(
        this.ln +
          `Can't set ${val}, because min=${this.min}. Was setted min value!`
      );
    }
    super.setValue(val);
  }
} // class

tasks.elementsTypes["number"] = ClassElementNumber;

trace = beforeTrace;
