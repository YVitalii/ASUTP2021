// створюємо прапорці трасування, так як в нас багато файлів нам потрібно в кожному
// з них вмикати трасування окремо від інших , тому кожний файл з кодом
// перед виконанням свого коду запамятовує поточне значення trace в beforeTrace: 'beforeTrace=trace'
// після завершення відновлює попереднє значення 'trace=beforeTrace', таким чином модулі не будуть заважати іншим
let trace = 1,
  beforeTrace = 0;

// аналог list, але в ньому зберігаються всі створені js-об'єкти регістрів
// для швидкого доступу
tasks.model = {};
tasks.model.data = [];

/**
 * Створює пустий рядок кроку програми
 * @param {Array} list
 *
 */

// tasks.newStep = (prefix) => {
//   let trace = 1,
//     ln = `tasks.newStep(${prefix})::`;
//   trace ? console.log(ln + `Started!`) : null;
//   let el = new tasks.createStep({
//     prefix: prefix,
//     reg: tasks.reg,
//     container: tasks.container,
//     types: tasks.elementsTypes,
//   });
//   if (trace) {
//     console.log(ln + `el=`);
//     console.dir(el);
//   }
//   return el;
// };

tasks.model.renumber = (array, start = 1) => {
  if (!array) {
    array = tasks.model.data;
  }
  if (start < 1) {
    start = 1;
  }
  for (let i = start; i < array.length; i++) {
    const element = array[i];
    if (Array.isArray(element)) {
      // TODO це масив підкроків
      let msg = ln + "Паралельні кроки поки не підтримуються !!";
      console.error(msg);
      throw new Error(msg);
    }
    if (typeof element == "object" && element.hasOwnProperty("stepNumber")) {
      element.renumber(i);
    }
  }
}; //tasks.model.renumber

tasks.model.deleteStep = (stepNumber) => {
  stepNumber = parseInt(stepNumber);
  let model = tasks.model;
  console.log("======model======");
  console.dir(model);
  if (!stepNumber || stepNumber === 0 || stepNumber > model.data.length - 1) {
    throw new Error(`Uncompatible stepNumber=${stepNumber} ! `);
    return;
  }

  let trace = 1,
    ln = `tasks.model.deleteStep(${stepNumber})::`;
  trace ? console.log(ln + `Started!`) : null;

  if (model.data.length <= 2) {
    alert(
      {
        ua: `Не можливо видалити останній крок  ${stepNumber}!`,
        en: `You can't delete the last step N ${stepNumber}!`,
        ru: `Невозмозно удалить последний шаг N${stepNumber}!`,
      }[lang]
    );
    throw new Error(ln + `Last step can't be deleted ! `);
    return;
  }
  if (
    !confirm(
      {
        ua: `Ви дійсно бажаєте видалити крок N ${stepNumber}?`,
        en: `Are You really want to delete step N ${stepNumber}?`,
        ru: `Вы действительно хотите удалить шаг N${stepNumber}?`,
      }[lang]
    )
  ) {
    console.log(ln + "Cancelled by user.");
    return;
  }
  // find element
  let el = model.data[stepNumber];
  trace ? console.log(ln + `el=${el.prefix}`) : null;
  // delete from DOM
  document.getElementById(el.prefix).remove();
  // delete from tasks.model.data
  model.data.splice(stepNumber, 1);
  tasks.model.renumber();
};

tasks.model.insertStep = (stepNumber = 0) => {
  stepNumber = parseInt(stepNumber);

  if (!stepNumber) {
    // якщо попередній крок не вказано, то додаємо в кінець масиву
    stepNumber = tasks.model.data.length;
  }

  let trace = 1,
    ln = `tasks.model.insertStep(after N${stepNumber})::`;
  trace ? console.log(ln + `Started!`) : null;

  let model = tasks.model;

  // визначаємо тип кроку
  let stepType = undefined;
  let stepTypes = Object.keys(tasks.reg.regs);
  if (stepTypes.length <= 2) {
    // під номером [0] йде опис програми, тому якщо в stepTypes тільки 2 елементи
    // то у нас тільки один тип кроку, беремо його
    stepType = stepTypes[1];
  } else {
    // більше одного типу кроків, окно вибору
    // TODO Доробити цей варіант з модальним окном
    tasks.modalWindow.setHeader(
      {
        ua: `Виберіть тип кроку`,
        en: `Select step type`,
        ru: `Выберите тип шага`,
      }[lang]
    );
    tasks.modalWindow.window.show();
  }
  trace ? console.log(ln + `New stepType=${stepType}`) : null;

  // крок після якого додавати новий
  let previousStep = document.getElementById(model.data[stepNumber].prefix);

  let el = tasks.createStep({
    stepNumber: 99,
    id: stepType,
    //container: hiddenStep,
    previousStep: previousStep,
  });

  if (trace) {
    console.log(ln + `previousStep=`);
    console.dir(previousStep);
  }

  // додаємо крок в model.data
  model.data.splice(stepNumber + 1, 0, el);
  // перенумеровуємо список
  model.renumber();
  // видаляємо вміст прихованого поля
};

tasks.model.moveUp = (stepNumber = undefined) => {
  stepNumber = parseInt(stepNumber);
  if (!stepNumber || stepNumber < 2) {
    throw new Error(`Uncompatible stepNumber=${stepNumber} ! `);
    return;
  }
  let trace = 1,
    ln = `tasks.model.moveUp(${stepNumber})::`;
  trace ? console.log(ln + `Started!`) : null;
};

tasks.model.moveDown = (stepNumber = undefined) => {
  stepNumber = parseInt(stepNumber);
  if (!stepNumber || stepNumber > tasks.model.data.length - 1) {
    throw new Error(`Uncompatible stepNumber=${stepNumber} ! `);
  }
  let trace = 1,
    ln = `tasks.model.moveDown(${stepNumber})::`;
  trace ? console.log(ln + `Started!`) : null;
};

tasks.createStep = (props = {}) => {
  let reg = tasks.reg.regs[props.id];
  let el;
  if (reg) {
    el = new tasks.ClassCreateStep({
      //editable: false, //tasks.reg.editable,
      model: tasks.model,
      stepNumber: props.stepNumber,
      reg: reg,
      container: props.container ? props.container : tasks.container,
      types: tasks.elementsTypes,
      previousStep: props.previousStep,
    });
    if (props.values) {
      el.setValues(props.values);
    }
  }
  return el;
};

tasks.renderList = function () {
  let trace = 1,
    ln = "tasks.renderList()::";

  // очищуємо модель
  tasks.model.data = [];

  // TODO Костиль з описом програми потрібно рендер опису
  tasks.model.data.push({ name: "Програма 1" });

  // очищуємо контейнер
  this.container.innerHTML = "";

  // для скорочення коду
  let list = tasks.list;

  // ------- створюємо заголовок ----------
  let header = document.createElement("div");
  header.classList.add("row");
  let title = document.createElement("div");
  title.classList.add("col");
  title.innerHTML = `<h6>${tasks.header[lang]}</h6>`;
  header.appendChild(title);
  tasks.container.classList = "border";
  this.container.appendChild(header);

  // if (list.length == 0) {
  //   // список програм пустий крок
  //   tasks.model.data.push(tasks.newStep("st1"));
  //   return;
  // } //if (list.length == 0)

  let i = 0;
  for (i = 0; i < list.length; i++) {
    let step = list[i];
    let props = {
      id: step.id,
      stepNumber: i,
      values: step,
    };
    let el = tasks.createStep(props);
    // let reg = tasks.reg.regs[step.id];
    // // trace ? console.log(ln + `reg=${JSON.stringify(reg)}`) : null;
    // if (reg) {
    //   let el = new this.ClassCreateStep({
    //     //editable: false, //tasks.reg.editable,
    //     model: tasks.model,
    //     stepNumber: i,
    //     reg: reg,
    //     container: tasks.container,
    //     types: tasks.elementsTypes,
    //   });
    //   //tasks.container.appendChild(el.main);
    //   el.setValues(step);
    if (!el) {
      console.error(`Помилка створення кроку: ${JSON.stringify(props)}`);
      continue;
    }
    tasks.model.data.push(el);
    if (trace) {
      console.log(ln + `el=`);
      console.dir(el);
    }
    //tasks.model = el;
  } //for
  // i += 1;
  // if (tasks.reg.editable || list.length === 0) {
  //   tasks.model.data.push(tasks.newStep(`st${("0" + i).slice(-2)}`));
  //   return;
  // }
};

/** список доступних класів типів регістрів,
 * що створюють відповідні елементи
 * {select:ClassElementSelect, number:ClassElementNumber, ...}
 */
tasks.elementsTypes = {};
