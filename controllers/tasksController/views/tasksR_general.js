// створюємо прапорці трасування, так як в нас багато файлів нам потрыбно в кожному
// з них вмикати трасування окремо від інших , тому кожний файл з кодом
// перед виконанням свого коду запамятовує поточне значення trace в beforeTrace: 'beforeTrace=trace'
// після завершення відновлює попереднє значення 'trace=beforeTrace', таким чином модулі не будуть заважати іншим
let trace = 1,
  beforeTrace = 0;

/**
 *
 * @param {String} prefix  - префікс
 * @param {Object} reg - обєкт в якому визначена властивість "id"
 * @returns {String} "prefix__reg.id" - два підкреслення (щоб легко відділяти id регістру)
 */

tasks.createId = function (prefix, reg) {
  return (id = prefix + "__" + reg.id);
};

tasks.renderRegs = function (prefix, regsList) {
  let trace = 1,
    ln = "tasks.renderRegs()::";
  for (let key in regsList) {
    trace ? console.log(ln + "key=" + key) : null;
    if (regsList.hasOwnProperty(key)) {
      if (trace) {
        console.dir(regsList[key]);
      }
    }
  }
};

tasks.elementsTypes = {};

class ClassCreateElement {
  /**
   * Створює налаштований DOM-елемент загального типу
   * @param {Object} props
   * @property {string} props.prefix - префікс ля id елементу
   * @property {string} props.tag - тип елементу (number,range,  select)
   * @property {Object} props.reg  - типовий регістр
   */
  constructor(props = {}) {
    this.ln = "ClassCreateElement()::";
    let trace = 1,
      ln = this.ln + "constructror()::";
    trace ? console.log(ln + "props=") : null;
    trace ? console.dir(props) : null;
    // -- тег основного елемента, щоб створити шаблон
    this.tag = props.tag;
    // -- префікс -----
    this.prefix = props.prefix;
    // -- регістр
    this.reg = props.reg;
    // -- id - елементу
    this.id = props.prefix + "__" + props.reg.id; //два підкреслення (щоб легко відділяти id регістру)
    // контайнер для всього елементу
    this.div = document.createElement("div");
    this.div.classList.add = "form-group column";
    // ---- <label> --------
    this.label = document.createElement("label");
    this.label.setAttribute("for", this.id);
    this.label.classList.add("h6");
    this.label.innerHTML = this.reg.header[lang];
    // ---- <title> --------
    this.comment = document.createElement("small");
    this.comment.innerHTML = this.reg.comment[lang];
    // ---- Field --------
    this.field = document.createElement(this.tag);
    this.field.dataset.beforeValue = "";
    this.field.classList.add("form-control");
    this.field.classList.add(this.prefix);
    this.field.id = this.id;
    this.div.appendChild(this.label);
    this.div.appendChild(this.field);
    this.div.appendChild(this.comment);
  }

  onchange(event) {
    let element = event.target;
    let ln = this.ln + "onchange()::";
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  set(prefix, obj) {}
  get() {}
}

tasks.ClassCreateElement = ClassCreateElement;
