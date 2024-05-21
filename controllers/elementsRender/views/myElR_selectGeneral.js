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
    let trace = 0,
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
    // промальовуємо список
    this.render();
    // -- початкова ініціалізація -----------
    // this.value = this.getFieldValue();
    trace ? console.log(ln + `this.value=${this.value}`) : null;

    if (trace) {
      console.log(ln + `this.getFieldValue()=${this.getFieldValue()}`);
      console.dir(this);
    }
  }

  async onchange(event) {
    let ln = this.ln + "onchange()::";
    let trace = 0;
    if (!this.hasChanged()) {
      return;
    }
    //debugger;
    // this.children.remove();
    // this.render(this.regs[this.getFieldValue()]);
    this.setValue(this.getOption(this.getFieldValue()));

    //await this.afterChange(this);

    super.onchange(event);
  }

  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    super.setValue(val);
  }

  render(regs = undefined) {
    let trace = 0,
      ln = this.ln + "render()::";
    trace ? console.log(ln + `Started::this.value=${this.value}`) : null;

    if (!regs) {
      // якщо список не вказано то приймаємо поточне значення
      regs = this.regs;
    } else {
      if (typeof regs === "object") {
        // знищуємо всіх дітей
        this.field.innerHTML = "";
        this.regs = undefined;
        // створюємо нових
        this.regs = regs;
      } else {
        console.error(ln + "regs must be an Object");
        return;
      }
    }

    // створюємо список <option>
    let keys = "";
    let first = true;
    let currKey = "";
    let firstKey = "";

    // якщо  regs - Об'єкт
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
          // перший елемент не записуємо, а запамятовуємо, щоб зробити його selected
          // якщо не вибрано інший елемент
          if (first) {
            firstKey = key;
            first = false;
            continue;
          }

          let option = (keys += `<option value='${this.setOption(
            key
          )}' ${selected}> ${this.regs[key].header[lang]} </option>\n`);
        }
      } //for
      // -- активуємо перший варіант, якщо не обрано іншого
      let selected = currKey === "" ? "selected" : "";
      // додаємо перший варіант
      keys =
        `<option value='${this.setOption(firstKey)}' ${selected}> ${
          this.regs[firstKey].header[lang]
        } </option>\n` + keys;
    } // if (typeof this.regs == "object")

    // якщо  regs - Масив
    if (Array.isArray(this.regs)) {
      let trace = 0;

      for (let i = 0; i < this.regs.length; i++) {
        const key = this.regs[i];
        let selected = "";
        // якщо this.value не вказано, то перший елемент в списку опцій обирається автоматично браузером
        if (!first && key == this.value) {
          selected = "selected";
          currKey = key;
          trace ? console.log(ln + `Selected: key=${key}`) : null;
        }
        // перший елемент не записуємо, а запамятовуємо, щоб зробити його selected
        // якщо не вибрано інший елемент
        if (first) {
          firstKey = key;
          first = false;
          continue;
        }
        let opt = `<option value='${key}' ${selected}> ${this.setOption(
          key
        )} </option>\n`;
        trace ? console.log(ln + "opt=" + opt) : null;
        keys += opt;
      }
      // -- активуємо перший варіант, якщо не обрано іншого
      let selected = currKey === "" ? "selected" : "";

      // додаємо перший варіант
      keys =
        `<option value='${firstKey}' ${selected} > ${this.setOption(
          firstKey
        )} </option>\n` + keys;
    } //if (Array.isArray

    // -- опції вибору -------
    this.field.innerHTML = keys;
    // -- даємо час щоби створити елементи

    // setTimeout(() => {
    //   // оновлюємо поточне значення
    //   let trace = 1,
    //     ln = this.ln + "setTimeOut()::";

    //   let val = this.getFieldValue();
    //   trace
    //     ? console.log(
    //         ln + `----- Started! this.id=${this.id}; field.value = ${val}`
    //       )
    //     : null;
    //   this.setValue(val);
    // }, 500);
  }
};

trace = beforeTrace;
