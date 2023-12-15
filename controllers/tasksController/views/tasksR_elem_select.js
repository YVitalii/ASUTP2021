// -----------  element: select -------------------
beforeTrace = trace;
trace = 1;

/**
 * Генерує елемент для вибору
 * @param {String} prefix
 * @param {Object} regsList - список об'єктів з яких потрібно побудувати елемент
 * @returns
 */

tasks.createSelectItem = function (prefix, regsList) {
  let ln = "createSelect::";
  let id = tasks.createId(prefix, regsList.type);
  // --- div
  let div = document.createElement("div");
  div.classList.add = "form-group";
  // --- label
  let label = document.createElement("label");
  label.setAttribute("for", id);
  label.classList.add("h6");
  label.innerHTML = regsList.type.header[lang];
  div.appendChild(label);
  // --- select
  let select = document.createElement("select");
  select.classList.add("form-control");
  select.id = id;
  let keys = "";
  for (let key in regsList.regs) {
    let trace = 1;
    trace ? console.log(ln + "key=" + key) : null;
    keys += `<option value='${key}'> ${regsList.regs[key].type.title[lang]} </option>`;
  }
  select.innerHTML = keys;
  select.onchange = function (el, prefix) {
    let trace = 1,
      ln = el.id + "::onchange()::";
    if (trace) {
      console.log(id + "::onchange::this=");
      console.dir(this);
      console.log(id + "::onchange::prefix=" + prefix);
      console.dir(prefix);
    }
  }.bind(regsList.regs, null, prefix);
  div.appendChild(select);
  let title = document.createElement("small");
  title.innerHTML = regsList.type.title[lang];
  div.appendChild(title);
  return div;
};

if (trace) {
  let select = tasks.createSelectItem("st_01", tasks.types);
  tasks.container.appendChild(select);
}

trace = beforeTrace;
