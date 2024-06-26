// -----------  element: textarea;  file: myElR_textarea  -------------------
beforeTrace = trace;
trace = 0;
/**
 * Створює та повертає елемент багаторядкового тексту
 *
 */
myElementsRender["textarea"] = class ClassElementNumber extends (
  myElementsRender.ClassCreateElement
) {
  constructor(props = {}) {
    props.tag = "textarea";
    super(props);
    this.ln = "ClassElementTextArea(" + props.reg.id + ")::";
    let trace = 0,
      ln = this.ln + "Constructor()::";

    // -- тип поля Number -------
    if (!props.reg.attributes || !props.reg.attributes.rows) {
      this.field.setAttribute("rows", "3");
    }

    // -- обробник зміни значення поля ----------
    // 2024-01-31 перенесено в батьківський клас
    // this.field.onchange = this.onchange.bind(this);

    this.field.setAttribute("value", props.reg.value);
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  onchange(event) {
    let trace = 0,
      ln = this.ln + "onchange()::";
    super.onchange(event);
    let val = this.getFieldValue();
    this.setValue(val);
    //this.field.value = this.value;
  } // onchange()

  // setValue(val) {
  //   if (val > this.max) {
  //     console.error(
  //       this.ln +
  //         `Can't set ${val}, because max=${this.max}. Was setted max value!`
  //     );
  //     val = this.max;
  //   }
  //   if (val < this.min) {
  //     val = this.min;
  //     console.error(
  //       this.ln +
  //         `Can't set ${val}, because min=${this.min}. Was setted min value!`
  //     );
  //   }
  //   super.setValue(val);
  // }
}; // class

trace = beforeTrace;
