// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

class ClassElementSelect extends ClassCreateElement {
  constructor(props = {}) {
    props.tag = "select";
    super(props);
    this.ln = "ClassElementSelect(" + props.reg.id + ")::";
    let trace = 1,
      ln = "ClassElementSelect()::";
    this.regs = this.reg.regs;

    // створюємо список <option>
    let keys = "";
    for (let key in this.reg.regs) {
      let trace = 1;
      trace ? console.log(ln + "key=" + key) : null;
      keys += `<option value='${key}'> ${this.reg.regs[key].comment[lang]} </option>`;
    }
    this.field.innerHTML = keys;
    // -- обробник зміни значення поля ----------
    this.field.onchange = this.onchange.bind(this);

    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  }
  onchange(event) {
    let trace = 1;
    super.onchange(event);
  }
}

tasks.elementsTypes["select"] = ClassElementSelect;

/**
 * Генерує елемент для вибору можливих варіантів
 * @param {String} prefix
 * @param {Object} regsList - список об'єктів з яких потрібно побудувати елемент
 * @returns
 */

// tasks.elementsTypes.select.set = function (prefix, regsList) {
//   select.onchange = function (event) {
//     let trace = 1;
//     let el = event.target;
//     return function () {
//       if (trace) {
//         console.log(id + "::el.value=");
//         console.dir(el.value);

//         console.log(id + "::onchange::this=");
//         console.dir(this);
//         console.log(id + "::onchange::prefix=" + prefix);
//         console.dir(prefix);
//       }
//       tasks.renderRegs(prefix, this[el.value].regs);
//     }.bind(regsList.regs, null, prefix)();
//   }; //.bind(regsList.regs, null, prefix);
//   div.appendChild(select);
//   let title = document.createElement("small");
//   title.innerHTML = regsList.type.title[lang];
//   div.appendChild(title);
//   select.dataset.beforeValue = select.value;

//   return div;
// };

if (trace) {
  // для тестування, створює елемент в контейнері
  let select = new tasks.elementsTypes.select({
    prefix: "st_01",
    reg: tasks.types,
  });
  tasks.container.appendChild(select.div);
}

trace = beforeTrace;
