// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

/**
 * Створює елемент вибору select
 * та заповнює його поля опціями вибору зі списку props.reg.regs
 * має функції setOption(val) та getOption
 */

myElementsRender["selectGeneral"] = class ClassElementSelect extends (
  myElementsRender.ClassCreateElement
) {
  /**
   * всі загальні поля беруться з батьківського конструктора
   * @param {*} props
   * @property {Function} props.getOption() - пост обробка функція викликається для обробки значення поля перед поверненням (наприклад для імені файла - можна додавати розширення .json)
   * @property {Function} props.setOption(val) - перед обробка функція викликається для обробки значення поля перед відображення в DOM (наприклад для імені файла - можна прибирати розширення .json)
   * @property {Object} props.reg.regs -  список варіантів вибору, типові регістри
   * @property {String | Number} props.reg.value - значення по замовчуванню
   */

  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSelectGeneral(" + props.reg.id + ")::";
    let trace = 1,
      ln = this.ln + "Constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    // regs
    this.regs = props.regs ? props.regs : this.reg.regs;

    this.setOption = props.setOption
      ? props.setOption
      : (val) => {
          return val;
        };

    this.getOption = props.getOption
      ? props.getOption
      : (val) => {
          return val;
        };
    this.renderOptions();
    // -- початкова ініціалізація -----------
    this.value = this.getFieldValue();
    trace ? console.log(ln + `this.value=${this.value}`) : null;

    if (trace) {
      console.log(ln + `this.getFieldValue()=${this.getFieldValue()}`);
      console.dir(this);
    }
  }

  async onchange(event) {
    let ln = this.ln + "onchange()::";
    let trace = 1;
    if (!this.hasChanged()) {
      return;
    }
    // this.children.remove();
    // this.render(this.regs[this.getFieldValue()]);
    this.setValue(this.getOption(this.getFieldValue()));

    await this._afterChange(this);

    super.onchange(event);
  }

  setValue(val) {
    let trace = 1,
      ln = this.ln + `setValue(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    //super.setValue(val);
  }

  renderOptions() {
    // знищуємо всіх дітей
    this.field.innerHTML = "";

    // створюємо список <option>
    let keys = "";
    let first = true;
    let currKey = "";
    if (typeof this.regs == "object" && !Array.isArray(this.regs)) {
      for (let key in this.regs) {
        let trace = 0;
        if (this.regs.hasOwnProperty(key)) {
          let selected = "";
          // якщо this.value не вказано, то перший елемент в списку опцій обирається автоматично браузером
          if (!first && key == this.value) {
            selected = "selected";
            currKey = key;
          }
          trace ? console.log(ln + "key=" + key) : null;
          keys += `<option value='${this.setOption(key)}' ${selected}> ${
            this.regs[key].header[lang]
          } </option>`;
        }
      } //for
    } // if (typeof this.regs == "object")

    if (Array.isArray(this.regs)) {
      let trace = 1;
      for (let i = 0; i < this.regs.length; i++) {
        const key = this.regs[i];
        let selected = "";
        // якщо this.value не вказано, то перший елемент в списку опцій обирається автоматично браузером
        if (!first && key == this.value) {
          selected = "selected";
          currKey = key;
        }
        let opt = `<option value='${key}' ${selected}> ${this.setOption(
          key
        )} </option>`;
        trace ? console.log(ln + "opt=" + opt) : null;
        keys += opt;
      }
    }
    // -- опції вибору -------
    this.field.innerHTML = keys;
  }
};

trace = beforeTrace;
