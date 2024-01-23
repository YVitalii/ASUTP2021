// створюємо прапорці трасування, так як в нас багато файлів нам потрыбно в кожному
// з них вмикати трасування окремо від інших , тому кожний файл з кодом
// перед виконанням свого коду запамятовує поточне значення trace в beforeTrace: 'beforeTrace=trace'
// після завершення відновлює попереднє значення 'trace=beforeTrace', таким чином модулі не будуть заважати іншим
let trace = 1,
  beforeTrace = 0;

/**
 * Створює рядка кроку програми
 * @param {Array} list
 *
 */
tasks.newStep = (prefix) => {
  let trace = 1,
    ln = `tasks.newStep(${prefix})::`;
  trace ? console.log(ln + `Started!`) : null;
  let el = new tasks.createStep({
    prefix: prefix,
    reg: tasks.reg,
    container: tasks.container,
    types: tasks.elementsTypes,
  });
  if (trace) {
    console.log(ln + `el=`);
    console.dir(el);
  }
  return el;
};

tasks.renderList = function () {
  let list = tasks.list;
  let trace = 1,
    ln = "tasks.renderList()::";

  // ------- створюємо заголовок ----------
  let header = document.createElement("div");
  header.classList.add("row");
  let title = document.createElement("div");
  title.classList.add("col");
  title.innerHTML = `<h6>${tasks.header[lang]}</h6>`;
  header.appendChild(title);
  tasks.container.classList = "border";
  this.container.appendChild(header);
  //

  tasks.model = [];

  if (list.length == 0) {
    // список програм пустий крок
    tasks.model.push(tasks.newStep("st1"));
    return;
  } //if (list.length == 0)
  let i = 1;
  for (i = 1; i < list.length; i++) {
    let step = list[i];
    let reg = tasks.reg.regs[step.id];
    // trace ? console.log(ln + `reg=${JSON.stringify(reg)}`) : null;
    if (reg) {
      let el = new this.createStep({
        prefix: `st${i + 1}`,
        reg: reg,
        container: tasks.container,
        types: tasks.elementsTypes,
      });
      el.setValues(step);
      tasks.model.push(el);
      if (trace) {
        console.log(ln + `el=`);
        console.dir(el);
      }
    }
    //tasks.model = el;
  } //for
  i += 1;
  if (tasks.reg.editable || list.length === 0) {
    tasks.model.push(tasks.newStep(`st${("0" + i).slice(-2)}`));
    return;
  }
};

/** список доступних класів типів регістрів,
 * що створюють відповідні елементи
 * {select:ClassElementSelect, number:ClassElementNumber, ...}
 */
tasks.elementsTypes = {};

//tasks.ClassCreateElement = ClassCreateElement;
