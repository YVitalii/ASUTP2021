// ------- myElR_buttonGroup.js -----------------------------------
beforeTrace = trace;
trace = 0;
/** Створює та повертає елемент buttonGroup
 * @prop {object} props.types - рендер myElementsRender
 * @prop {object} props.reg.classes - класи, що потрібно застосувати до групи кнопок
 * @prop {object} props.reg.attributes  - атрибути, що потрібно застосувати до групи кнопок
 * @prop {object} props.reg.regs  - список дітей
 */
myElementsRender["buttonGroup"] = class ClassButtonGroup extends (
  myElementsRender.ClassGeneralElement
) {
  constructor(props = {}) {
    props.ln = props.ln ? props.ln : `buttonGroup()::`;
    super(props);
    let trace = 0,
      ln = this.ln + "Constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    // список типів для рендерингу елементів
    this.types = props.types
      ? props.types
      : console.error(this.ln + " types is not defined! ");
    // -- милиця для регістрів ---------
    // this.reg.regs = props.regs;
    // this.regs = this.reg.regs;
    // створюємо группу кнопок
    let btnGroup = document.createElement("div");
    // налаштовуємо класи
    if (this.reg.classes) {
      this.setClassList(btnGroup, this.reg.classes);
    } else {
      this.setClassList(btnGroup, "col btn-group-vertical");
    }
    btnGroup.setAttribute("role", "group");
    // налаштовуємо атрибути, якщо вони є
    if (this.reg.attributes) {
      this.setAttributes(btnGroup, this.attributes);
    }
    this.btnGroup = btnGroup;
    // створюємо кнопки
    this.children = {};
    if (trace) {
      console.log(ln + `Before parse children: this=`);
      console.dir(this);
    }
    for (let key in this.reg.regs) {
      if (this.reg.regs.hasOwnProperty(key)) {
        let trace = 0,
          ln = this.ln + `CreateButton(${key})::`;
        let btn = {};
        btn = this.reg.regs[key];
        // btn.id = this.id + "_" + key;
        //btn.ln = ln;
        btn.container = this.btnGroup;
        btn.parent = this.reg;
        // btn.action = btn.reg.action;
        if (trace) {
          console.log(ln + `btn=`);
          console.dir(btn);
        }
        this.children[key] = new this.types["button"](btn);
      }
    }
    this.el = btnGroup;
    this.container.appendChild(this.el);
    if (trace) {
      console.log(ln + `this=`);
      console.dir(this);
    }
  } // costructor
};
