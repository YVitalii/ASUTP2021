// аналог list, але в ньому зберігаються всі створені js-об'єкти регістрів
// для швидкого доступу
tasks.model = {};
// дані моделі
tasks.model.data = [];
// ознака редагування
tasks.model.edited = false;
tasks.model.hasEdited = () => tasks.model.edited;
// функція що змінює стан на "редаговано"
tasks.model.setEdited = async (el = {}) => {
  let trace = 0,
    ln = "tasks.model.setEdited::";
  if (trace) {
    console.log("i", ln, `el=`);
    console.dir(el);
  }
  if (tasks.model.hasEdited()) return;
  tasks.model.edited = true;
  fileManager.buttons.checkState();
  return;
};
// функція що змінює стан на "не редаговано"
tasks.model.setNotEdited = () => {
  tasks.model.edited = false;
  fileManager.buttons.checkState();
};
// ознака рендерингу програми, бо якщо вибрати інше імя програми коли вона рендериться,
// виникає ситуація : Програму змінено, так як на момент рендерингу ми встановлюємо нові
// значення і tasks.model.hasEdited=true
tasks.model.rendering = false;

/**
 * Перенумеровує кроки у випадку видалення/додавання
 * @param {*} array
 * @param {*} start
 */
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
  let stepString = ("00" + stepNumber).slice(-2);
  let trace = 0,
    ln = `tasks.model.deleteStep(${stepString})::`;
  trace ? console.log(ln + `Started!`) : null;

  if (model.data.length <= 2) {
    alert(
      {
        ua: `Не можливо видалити останній крок  ${stepString}!`,
        en: `You can't delete the last step  ${stepString}!`,
        ru: `Невозмозно удалить последний шаг ${stepString}!`,
      }[lang]
    );
    throw new Error(ln + `Last step can't be deleted ! `);
    return;
  }
  if (
    !confirm(
      {
        ua: `Ви дійсно бажаєте видалити крок № ${stepString}?`,
        en: `Are You really want to delete step № ${stepString}?`,
        ru: `Вы действительно хотите удалить шаг № ${stepString}?`,
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
  tasks.model.setEdited();
};

tasks.model.insertStep = async (stepNumber = 0) => {
  //debugger;
  stepNumber = parseInt(stepNumber);

  if (!stepNumber) {
    // якщо попередній крок не вказано, то додаємо в кінець масиву
    stepNumber = tasks.model.data.length;
  }

  let trace = 0,
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

  let el = await tasks.createStep({
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

  tasks.model.setEdited();
};

/** Функція проходить по всім елементам tasks.model.data
 * та повертає значення регістрів та записує їх до масиву tasks.list
 * повертає масив з даними
 */

tasks.model.getValues = () => {
  let modelData = tasks.model.data;
  let data = [];
  for (let i = 0; i < modelData.length; i++) {
    data.push(modelData[i].getValues());
  }
  tasks.list = data;
  return data;
};

/** 2024-02-07 поки не використовується, та й чи потрібні взагалі?*/
tasks.model.moveUp = (stepNumber = undefined) => {
  // stepNumber = parseInt(stepNumber);
  // if (!stepNumber || stepNumber < 2) {
  //   throw new Error(`Uncompatible stepNumber=${stepNumber} ! `);
  //   return;
  // }
  // let trace = 1,
  //   ln = `tasks.model.moveUp(${stepNumber})::`;
  // trace ? console.log(ln + `Started!`) : null;
};

tasks.model.moveDown = (stepNumber = undefined) => {
  // stepNumber = parseInt(stepNumber);
  // if (!stepNumber || stepNumber > tasks.model.data.length - 1) {
  //   throw new Error(`Uncompatible stepNumber=${stepNumber} ! `);
  // }
  // let trace = 1,
  //   ln = `tasks.model.moveDown(${stepNumber})::`;
  // trace ? console.log(ln + `Started!`) : null;
};

tasks.createStep = async (props = {}) => {
  let reg = tasks.reg.regs[props.id];
  let el;
  if (reg) {
    el = new tasks.ClassCreateStep({
      model: tasks.model,
      stepNumber: props.stepNumber,
      reg: reg,
      container: props.container ? props.container : tasks.container,
      types: tasks.elementsTypes,
      previousStep: props.previousStep,
      afterChange: props.afterChange,
    });
    if (props.values) {
      el.setValues(props.values);
    }
    await myTools.dummy(150);
  } else {
    console.error("tasks.createStep undefined type of task:" + props.id);
  }
  return el;
};

tasks.renderList = async function (list = undefined) {
  let trace = 0,
    ln = "tasks.renderList()::";
  // встановлюємо ознаку рендерингу
  tasks.model.rendering = true;
  // очищуємо модель
  tasks.model.data = [];

  // очищуємо контейнер
  this.container.innerHTML = "";

  // для скорочення коду
  if (list != undefined && Array.isArray(list)) {
    tasks.list = list;
  }
  list = tasks.list;

  // ------- створюємо заголовок ----------
  let header = document.createElement("div");
  header.classList.add("row");
  let title = document.createElement("div");
  title.classList.add("col");
  title.innerHTML = `<h6>${tasks.header[lang]}</h6>`;
  header.appendChild(title);
  tasks.container.classList.add("border");
  this.container.appendChild(header);

  // if (list.length == 0) {
  //   // список програм пустий крок
  //   tasks.model.data.push(tasks.newStep("st1"));
  //   return;
  // } //if (list.length == 0)

  let i = 0;
  for (i = 0; i < list.length; i++) {
    trace ? console.time("createStep") : null;
    let step = list[i];
    let props = {
      id: step.id,
      stepNumber: i,
      values: step,
      afterChange: tasks.model.setEdited,
    };
    let el = await tasks.createStep(props);
    if (!el) {
      console.error(`Помилка створення кроку: ${JSON.stringify(props)}`);
      continue;
    }
    tasks.model.data.push(el);
    //debugger;
    if (trace) {
      console.log(ln + `el=`);
      console.dir(el);
    }
    // костиль-затримка, так як ДОМ інколи не встигає додати всіх дітей
    // і вони потрапляють в наступний крок

    // for (let j = 0; j < 10000; j++) {
    //   let r = Math.sqrt(j) + Math.sqrt(j + 3);
    //   null;
    // }
    trace ? console.timeEnd("createStep") : null;
  } //for
  // скидаємо ознаку рендерингу
  tasks.model.rendering = false;
  // скидаємо ознаку редагування
  tasks.model.setNotEdited();
};
