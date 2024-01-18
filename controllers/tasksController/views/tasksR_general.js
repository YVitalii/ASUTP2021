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

    let el = new this.createStep({
      prefix: "st1",
      reg: tasks.reg,
      container: tasks.container,
      types: tasks.elementsTypes,
    });
    if (trace) {
      console.log(ln + `el=`);
      console.dir(el);
    }
    return;
  } //if (list.length == 0)

  for (let i = 0; i < list.length; i++) {
    let step = list[i];
    let reg = tasks.reg.regs[step.id];
    // trace ? console.log(ln + `reg=${JSON.stringify(reg)}`) : null;
    if (reg) {
      let el = new this.createStep({
        prefix: `st${i}`,
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

  //tasks.container.appendChild(step);
  // for (let key in list) {
  //   trace ? console.log(ln + "key=" + key) : null;
  //   if (regsList.hasOwnProperty(key)) {
  //     if (trace) {
  //       console.dir(list[key]);
  //     }
  //   }
  // }
};

/** список доступних класів типів регістрів,
 * що створюють відповідні елементи
 * {select:ClassElementSelect, number:ClassElementNumber, ...}
 */
tasks.elementsTypes = {};

//tasks.ClassCreateElement = ClassCreateElement;
