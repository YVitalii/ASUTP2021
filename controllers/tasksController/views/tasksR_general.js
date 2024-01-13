// створюємо прапорці трасування, так як в нас багато файлів нам потрыбно в кожному
// з них вмикати трасування окремо від інших , тому кожний файл з кодом
// перед виконанням свого коду запамятовує поточне значення trace в beforeTrace: 'beforeTrace=trace'
// після завершення відновлює попереднє значення 'trace=beforeTrace', таким чином модулі не будуть заважати іншим
let trace = 1,
  beforeTrace = 0;

/**
 * Створює відображення рядка кроку програми
 * @param {Array} list
 *
 */

tasks.createRow = (container, prefix) => {
  let row = document.createElement("div");
  row.classList.add("row");
  row.classList.add("border");
  row.classList.add("border-secondary");
  row.id = prefix;
  let stepNumber = document.createElement("div");
  stepNumber.classList.add("col-1");
  stepNumber.innerHTML = "<h6>" + prefix + "</h6>";
  row.appendChild(stepNumber);
  return row;
};

tasks.renderList = function (list = []) {
  let trace = 1,
    ln = "tasks.renderList()::";
  let header = document.createElement("div");
  header.classList.add("row");
  let title = document.createElement("div");
  title.classList.add("col");
  title.innerHTML = `<h6>${tasks.reg.header[lang]}</h6>`;
  header.appendChild(title);
  // header = document.createElement("h4");
  //header.innerHTML = tasks.reg.header[lang];
  tasks.container.classList = "border";
  this.container.appendChild(header);

  let step = this.createRow(tasks.container, "st1");
  if (trace) {
    console.log(ln + `step=`);
    console.dir(step);
  }
  if (list.length == 0) {
    // список програм пустий
    let el = new ClassElementSelect({
      prefix: "st1",
      reg: tasks.reg,
      container: step,
    });
    if (trace) {
      console.log(ln + `el=`);
      console.dir(el);
    }
    step.appendChild(el.div);
    //return;
  }

  tasks.container.appendChild(step);
  // for (let key in list) {
  //   trace ? console.log(ln + "key=" + key) : null;
  //   if (regsList.hasOwnProperty(key)) {
  //     if (trace) {
  //       console.dir(list[key]);
  //     }
  //   }
  // }
};

/** список доступних типів регістрів, містить в собі класи, що створюють відповідні елементи
 * {select:ClassElementSelect, number:ClassElementNumber, ...}
 */
tasks.elementsTypes = {};

class ClassCreateElement {
  /**
   * Створює налаштований DOM-елемент загального типу
   * @param {Object} props
   * @property {string} props.prefix - префікс ля id елементу
   * @property {string} props.tag - тип елементу (number,range,  select)
   * @property {Object} props.reg  - типовий регістр
   * @property {Object} props.container - контейнер в якому потрібно розмістити елемент
   */
  constructor(props = {}) {
    this.ln = "ClassCreateElement()::";
    let trace = 1,
      ln = this.ln + "constructror()::";
    trace ? console.log(ln + "props=") : null;
    trace ? console.dir(props) : null;
    // -- батьківський контейнер для елементу -----
    if (!props.container) {
      console.error(ln + "Не вказано батьківський контейнер!!!");
    } else {
      this.container = props.container;
    }
    // -- тег основного елемента, щоб створити шаблон
    this.tag = props.tag;
    // -- префікс -----
    this.prefix = props.prefix;
    // -- регістр
    this.reg = props.reg;

    // -- id - елементу
    this.id = props.prefix + "__" + props.reg.id; //два підкреслення (щоб легко відділяти id регістру)
    // контейнер для всього елементу
    this.div = document.createElement("div");
    this.div.classList.add("col");
    this.div.classList.add("form-group");
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
    // -- поточне значення -----
    if (props.reg.value | (props.reg.value === 0)) {
      this.value = props.reg.value;
      this.setValue(this.value);
    }
  }

  onchange(event) {
    let ln = this.ln + "onchange()::";
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
    trace ? console.log(ln + "this.field.value=" + this.getValue()) : null;
  }

  setValue(val) {
    this.field.dataset.beforeValue = this.value;
    this.value = val;
    this.field.value = val;
  }

  getValue() {
    return this.field.value;
  }
}

tasks.ClassCreateElement = ClassCreateElement;
