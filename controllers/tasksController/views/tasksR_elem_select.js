// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

class ClassElementSelect extends ClassCreateElement {
  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSelect(" + props.reg.type.id + ")::";
    let trace = 1,
      ln = "ClassElementSelect()::";
    this.regs = this.reg.regs;

    // створюємо список <option>
    let keys = "";
    for (let key in this.reg.regs) {
      let trace = 1;
      trace ? console.log(ln + "key=" + key) : null;
      keys += `<option value='${key}'> ${this.reg.regs[key].type.title[lang]} </option>`;
    }
    this.field.innerHTML = keys;
    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange;

    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  onchange(el) {}
}

tasks.elementsTypes["select"] = ClassElementSelect;

/**
 * Генерує елемент для вибору можливих варіантів
 * @param {String} prefix
 * @param {Object} regsList - список об'єктів з яких потрібно побудувати елемент
 * @returns
 */

tasks.elementsTypes.select.set = function (prefix, regsList) {
  let ln = "select.set::";
  let id = tasks.createId(prefix, regsList.type);
  // --- div
  let div = document.createElement("div");
  div.classList.add = "form-group";
  // --- створюємо <label>
  let label = document.createElement("label");
  label.setAttribute("for", id);
  label.classList.add("h6");
  label.innerHTML = regsList.type.header[lang];
  div.appendChild(label);

  // --- створюємо <select>
  let select = document.createElement("select");
  select.classList.add("form-control");
  label.classList.add(prefix);
  select.id = id;

  select.onchange = function (event) {
    let trace = 1;
    let el = event.target;
    return function () {
      if (trace) {
        console.log(id + "::el.value=");
        console.dir(el.value);

        console.log(id + "::onchange::this=");
        console.dir(this);
        console.log(id + "::onchange::prefix=" + prefix);
        console.dir(prefix);
      }
      tasks.renderRegs(prefix, this[el.value].regs);
    }.bind(regsList.regs, null, prefix)();
  }; //.bind(regsList.regs, null, prefix);
  div.appendChild(select);
  let title = document.createElement("small");
  title.innerHTML = regsList.type.title[lang];
  div.appendChild(title);
  select.dataset.beforeValue = select.value;

  return div;
};

if (trace) {
  // для тестування, створює елемент в контейнері
  let select = tasks.elementsTypes.select.set("st_01", tasks.types);
  tasks.container.appendChild(select);
}

trace = beforeTrace;