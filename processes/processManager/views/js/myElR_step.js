// -----------  element: input type="number" -------------------
beforeTrace = trace;
trace = 1;
/**
 * Створює та повертає елемент відображення задачі
 *
 */
class ClassElementStep extends myElementsRender.ClassGeneralElement {
  constructor(props = {}) {
    super(props);

    this.ln = "ClassElementStep(" + props.reg.id + ")::";
    let trace = 0,
      ln = this.ln + "Constructor()::";

    // --- загальний контейнер для кроку
    this.el = document.createElement("div");
    this.el.classList.add(
      "col",
      "border",
      "border-2",
      "rounded-3",
      "bg-secondary",
      "text-light"
    );
    this.el.setAttribute("title", this.reg.comment[lang]);
    this.el.setAttribute("id", this.id);

    // ----- рядок заголовка
    let headerRow = document.createElement("div");
    headerRow.classList.add("row", "fw-bold", "text-center");
    // рядок заголовка: номер кроку
    let number = document.createElement("div");
    number.classList.add("col-3", "col-md-auto");
    let stepNumber = "";
    this.reg.id
      .split("_")
      .slice(1)
      .map((item) => {
        stepNumber += item + ":";
      });
    stepNumber = stepNumber.slice(0, -1);
    number.innerHTML = stepNumber;
    // рядок заголовка: Заголовок
    let header = document.createElement("div");
    header.classList.add("col");
    header.innerHTML = this.reg.header[lang];
    headerRow.appendChild(number);
    headerRow.appendChild(header);
    this.el.appendChild(headerRow);

    // // ----- рядок поточного стану -
    //  2024-04-12 не використовуємо щоб зберегти місце, і так видно стан по кольору
    // let stateRow = document.createElement("div");
    // stateRow.classList.add("row");
    // let note = document.createElement("div");
    // note.classList.add("col");
    // note.innerHTML = this.reg.note[lang];
    // stateRow.appendChild(note);
    // this.el.appendChild(stateRow);

    // ----- під-кроки
    let subStepRow = document.createElement("div");
    subStepRow.classList.add("row");

    for (let i = 0; i < this.reg.tasks.length; i++) {
      const element = this.reg.tasks[i];
      //debugger;
      let subStepCol = document.createElement("div");

      subStepCol.classList.add("col", "text-center", "text-nowrap");
      subStepCol.setAttribute("id", this.id + "_" + element.id);
      subStepCol.setAttribute("title", element.comment[lang]);
      ClassElementStep.setState(subStepCol, element._id);
      subStepCol.innerHTML = element.header[lang];
      element.el = subStepCol;
      subStepRow.appendChild(subStepCol);
    }
    this.el.appendChild(subStepRow);

    this.container.appendChild(this.el);
    if (trace) {
      console.log(ln + "this=");
      console.dir(this);
    }
  } // constructor

  // onchange(event) {
  //   let trace = 0,
  //     ln = this.ln + "onchange()::";
  //   super.onchange(event);
  //   // let val = this.getFieldValue();
  //   // this.setValue(val);
  //   //this.field.value = this.value;
  // } // onchange()

  // setValue(val) {
  //   super.setValue(val);
  // }
  // setState (newState){
  //   let states = myElementsRender["step"].stateClasses;
  //   let beforeState = el.getAttribute("data-state");
  // if (!states[newState]) {
  //   console.error(`Undefined state: "${newState}"`);
  //   return;
  // }
  // if (beforeState == newState) {
  //   return;
  // }
  // if (beforeState) {
  //   for (let i = 0; i < states[beforeState].length; i++) {
  //     el.classList.remove(states[beforeState][i]);
  //   }
  // }
  // for (let i = 0; i < states[newState].length; i++) {
  //   el.classList.add(states[newState][i]);
  // }
  // el.setAttribute("data-state", newState);
  // }
} // class

ClassElementStep.stateClasses = {
  waiting: ["bg-secondary", "text-light"],
  going: ["bg-primary", "text-light"],
  finished: ["bg-success", "text-light"],
  error: ["bg-danger", "text-light"],
  stoped: ["bg-warning", "text-dark"],
};

ClassElementStep.setState = (el, newState) => {
  let states = myElementsRender["step"].stateClasses;
  let beforeState = el.getAttribute("data-state");
  if (!states[newState]) {
    console.error(`Undefined state: "${newState}"`);
    return;
  }
  if (beforeState == newState) {
    return;
  }
  if (beforeState) {
    for (let i = 0; i < states[beforeState].length; i++) {
      el.classList.remove(states[beforeState][i]);
    }
  }
  for (let i = 0; i < states[newState].length; i++) {
    el.classList.add(states[newState][i]);
  }
  el.setAttribute("data-state", newState);
};

myElementsRender["step"] = ClassElementStep;
trace = beforeTrace;
