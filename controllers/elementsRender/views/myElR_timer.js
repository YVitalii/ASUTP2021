// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

/**
 * Створює елемент для вводу часу
 *
 */

//

myElementsRender["timer"] = class ClassElementTimer extends (
  myElementsRender.ClassCreateElement
) {
  constructor(props = {}) {
    props.tag = "input";
    super(props);
    this.ln = "ClassElementTimer(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";

    // -- тип поля  -------
    this.field.setAttribute("type", "time");

    // хв, мінімальне значення
    this.min = 0;
    if (props.reg.min || props.reg.min === 0) {
      this.min = props.reg.min;
    }
    this.field.setAttribute("min", this.minutesToString(this.min));

    // хв, максимальне значення
    this.max = 99 * 60; //99 годин
    if (props.reg.max | (props.reg.max === 0)) {
      this.max = props.reg.max;
    }
    this.field.setAttribute("max", this.minutesToString(this.max));

    // встановлюємо значення поля
    this.field.value = this.minutesToString(this.value);

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
    this.setValue(this.stringToMinutes(val));
    //this.field.value = this.value;
  } // onchange()

  /**
   * Вираховує кількість хвилин в hhmm
   * @param {String} hhmm - час в форматі "00:00"
   */
  stringToMinutes(hhmm = "00:00") {
    let ln = this.ln + `stringToMinutes(${hhmm})::`;
    let arr = hhmm.split(":");
    if (arr.length > 2) {
      throw Error(ln + `Невірний формат аргументу`);
    }
    let val = parseInt(arr[0]) * 60 + parseInt(arr[1]);
    return val;
  }

  minutesToString(minutes = 0) {
    minutes = isNaN(parseInt(minutes)) ? 0 : parseInt(minutes);
    let time = new Date(minutes * 60 * 1000).toISOString();
    //console.log(time);
    return time.slice(11, -8);
  }

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
    this.field.value = this.minutesToString(val);
  }
}; // class
// console.log("Element type : timer loaded");
trace = beforeTrace;
