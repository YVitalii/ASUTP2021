// -----------  element: select -------------------
beforeTrace = trace;
trace = 0;
/**
 * Створює та повертає елемент вибору
 *
 */
tasks.ClassCreateStep = class ClassCreateStep {
  /**
   * Створює контейнер з регістрами
   * @param {*} props
   * @property {DOMnode} props.container - DOM контенер в якому буде розміщено крок
   * @property {String} props.stepNumber - номер кроку в tasks.model.data "01","02:02"
   * @property {Object} props.reg - регістр, що містить в собі опис кроку
   * @property {Object} props.types - список доступних класів, що рендерять елементи
   * @property {Object} props.previousStep=undefined - елемент DOM після якого вставляти новий крок
   */

  constructor(props = {}) {
    this.ln = "ClassCreateStep(" + props.reg.id + ")::";

    let trace = 0,
      ln = this.ln + "Constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    //
    if (!props.reg) {
      throw new Error(ln + "No item 'props.reg' defined");
    }
    this.reg = props.reg;
    // for testing this.reg.editable = false;
    // номер кроку
    if (!props.stepNumber && props.stepNumber != 0) {
      throw new Error(ln + "No item 'props.stepNumber' defined");
    }
    this.stepNumber = props.stepNumber;

    // створюємо унікальний префікс
    this.prefix = "id" + `${new Date().getTime().toString().slice(-6)}`;

    // this.types
    if (!props.types) {
      throw new Error(ln + "No item 'props.types' defined");
    }
    this.types = props.types;

    // this.model
    if (!props.model) {
      throw new Error(ln + "No item 'props.model' defined");
    }
    this.model = props.model;

    // створюємо контейнер для кроку
    {
      let row = document.createElement("div");
      row.classList.add("row");
      let col = document.createElement("div");
      col.classList.add("col");
      let main = document.createElement("div");
      main.classList.add("container-fluide");
      main.classList.add("border");
      main.classList.add("border-secondary");
      main.id = this.prefix;
      col.appendChild(main);
      row.appendChild(col);
      this.main = row;
      this.main.id = this.prefix;
    }

    // ------- додаємо контейнер в документ --------
    if (props.previousStep === undefined) {
      // попередній елемент не вказано,
      if (!props.container) {
        // контейнер не вказано - Помилка
        throw new Error(ln + "No props.container defined");
        return;
      } else {
        //додаємо крок в кінець контейнера
        props.container.appendChild(this.main);
      }
    } else {
      // вставляємо крок після попереднього елементу
      props.previousStep.after(this.main);
    }

    //  створюємо заголовок

    {
      let trace = 0;
      let header = document.createElement("div");
      header.classList.add("row");

      // номер кроку
      let numberCol = document.createElement("div");
      numberCol.classList.add("col-md-auto");
      this.numberField = document.createElement("span");
      this.numberField.classList.add("h5");
      this.renumber(this.stepNumber);
      numberCol.appendChild(this.numberField);
      header.appendChild(numberCol);

      // тип кроку
      let headerCol = document.createElement("div");
      headerCol.classList.add("col");
      let headerTitle = document.createElement("span");
      headerTitle.classList.add("h5");
      headerTitle.innerHTML = this.reg.header[lang];
      headerCol.appendChild(headerTitle);
      header.appendChild(headerCol);

      if (this.reg.editable) {
        header.appendChild(this.buttonsEditCreate());
      }

      // if (trace) {
      //   console.log(ln + `Type "regsList" was found. Created header=`);
      //   console.dir(header);
      // }

      this.main.appendChild(header);
    }

    // створюємо рядок, в якому буде розташовуватися вміст кроку
    let row = document.createElement("div");
    row.classList.add("row");
    row.id = this.prefix + "_row";
    this.main.appendChild(row);
    this.container = row;

    // рендеримо дітей
    this.children = new tasks.ClassRegsList({
      prefix: this.prefix,
      container: this.container,
      //parent: this,
      regs: this.reg.regs,
      types: this.types,
    });
    // console.log("------ getValues -------");
    // console.log(this.children.getValues());

    if (trace) {
      console.log(ln + `this=${""}`);
      console.dir(this);
    }
  }

  renumber(newNumber) {
    this.stepNumber = newNumber;
    this.numberField.innerHTML = "№ " + ("00" + this.stepNumber).slice(-2);
  }

  /**
   * Створює та повертає группу кнопок редагування
   */
  buttonsEditCreate() {
    // ---------- кнопки керування --------------------

    let buttonGroupe = document.createElement("div");
    buttonGroupe.classList.add("col-md-auto");
    buttonGroupe.classList.add("btn-group");
    buttonGroupe.setAttribute("role", "group");
    buttonGroupe.setAttribute("aria-label", "edit buttons");
    buttonGroupe.setAttribute("data-parent", this.prefix);

    /** Функція створює стандартну кнопку DOM та повертає її
     * @param {Object} props - список налаштувань
     * @property {Object} props.this - посилання на поточний об'єкт кроку
     * @property {String} props.style - стиль кнопки, наприклад "btn-info"
     * @property {Object} props.title - спливаюча підказка { ua:`` , en: ``, ru: `` };
     * @property {String} props.innerHTML - внутрішній код
     * @property {function} props.onclick - подія натискання
     * @returns {DOM-element} - DOM елемент кнопки
     */

    let createButton = (props = {}) => {
      let but = document.createElement("button");
      but.classList.add("btn");
      but.classList.add(props.style ? props.style : "btn-secondary");
      but.id =
        props.this.prefix +
        (props.name
          ? props.name
          : "noNameButton" + new Date().getTime().toString().slice(-7));
      but.setAttribute(
        "title",
        props.title
          ? props.title[lang]
          : {
              ua: `Немає опису`,
              en: `Undefined description`,
              ru: `Нет описания`,
            }[lang]
      );
      but.innerHTML = props.innerHTML ? props.innerHTML : "<h6>???</h6>";

      // but.onclick = props.onclick ? props.onclick.bind(this) : undefined;
      but.onclick = props.this.button_onclick
        ? props.this.button_onclick.bind(props.this)
        : undefined;
      return but;
    };

    // // -- buttom UP
    // let but_up = createButton({
    //   style: "btn-secondary",
    //   name: "_up",
    //   title: { ua: `Вище`, en: `Move up`, ru: `Вверх` },
    //   innerHTML: "<h6>&#9650;</h6>",
    //   this: this,
    // });
    // buttonGroupe.appendChild(but_up);

    // // -- buttom DOWN

    // let but_down = createButton({
    //   style: "btn-secondary",
    //   name: "_down",
    //   title: { ua: `Нижче`, en: `Move down`, ru: `Вниз` },
    //   innerHTML: "<h6>&#9660;</h6>",
    //   this: this,
    // });

    // buttonGroupe.appendChild(but_down);

    // -- buttom insert
    let but_insert = createButton({
      style: "btn-primary",
      name: "_insert",
      title: { ua: `Додати крок`, en: `Add step`, ru: `Добавить шаг` },
      innerHTML: "<h6>+</h6>",
      this: this,
    });
    buttonGroupe.appendChild(but_insert);

    // -- buttom DELETE
    let but_del = createButton({
      style: "btn-danger",
      name: "_del",
      title: { ua: `Видалити`, en: `Delete`, ru: `Удалить` },
      innerHTML: "<h6>X</h6>",
      this: this,
    });

    buttonGroupe.appendChild(but_del);
    return buttonGroupe;
  }

  button_onclick(ev) {
    let target = ev.target;
    //
    if (!target.id) {
      target = target.parentNode;
    }

    let id = target.id;

    let trace = 0,
      ln = this.ln + `button_onclick()::`; //
    trace
      ? console.log(ln + `Was pressed button [${id ? id : target.tagName}]!`)
      : null;
    let action = id.split("_").slice(-1)[0];
    trace ? console.log(ln + `Action is [${action}]!`) : null;
    //console.dir(target);
    switch (action) {
      case "del":
        this.model.deleteStep(this.stepNumber);
        break;
      case "up":
        this.model.moveUp(this.stepNumber);
        break;
      case "down":
        this.model.moveDown(this.stepNumber);
        break;
      case "insert":
        this.model.insertStep(this.stepNumber);
        break;
      default:
        console.error(ln + `Action "${action}" not finded!`);
        break;
    }
  }
  // onchange(event) {}
  getValues() {
    let res = {};
    res["id"] = this.reg.id;
    return Object.assign(res, this.children.getValues());
  }

  setValues(values) {
    let trace = 0,
      ln = this.ln + `setValues()::`;
    trace ? console.log(ln + `Started`) : null;
    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        trace ? console.log(ln + `for(key=${key})=${values[key]}`) : null;
        this.children.setRegister(key, values[key]);
      } // if (value.hasOwnProperty(key))
    } //for
  }
}; // ClassCreateStep

trace = beforeTrace;
