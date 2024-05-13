naviButtons.prefix = "taskBar";
naviButtons.reg = {
  type: "buttonGroup",
  id: "naviButtons",
  ln: "",
  regs: {},
  classes: "btn-group",
};
naviButtons.types = myElementsRender;
naviButtons.ln = "naviButtons::";

{
  // описуємо кнопки

  let button;
  // debugger;
  // -------------  buttonDepartment ------------
  button = {
    //container: processMan.buttons.container,
    // parent: n
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonDepartment",
      //ln: ln + this.id,
      header: { ua: `Цех`, en: `Department`, ru: `Цех` },
      type: "button",
      comment: {
        ua: `Сторінка вибору печі`,
        en: `The page for select a furnace`,
        ru: `Страница выбора печи`,
      },
      //classes: "border fw-bold",
      attributes: { href: "/" },
      classes: "btn-outline-primary",
    },
    onclick: async function (e) {
      let trace = 0,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;
      if (trace) {
        debugger;
      }
    }, //onclick
  };
  naviButtons.reg.regs[button.reg.id] = button;

  // -------------  buttonEntity ------------
  button = {
    //container: processMan.buttons.container,
    // parent: n
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonEntity",
      //ln: ln + this.id,
      header: { ua: `Піч`, en: `Furnace`, ru: `Печь` },
      type: "button",
      comment: {
        ua: `Головна сторінка печі`,
        en: `The main page of entity`,
        ru: `Главная страница изделия`,
      },
      //classes: "border fw-bold",
      attributes: { href: naviButtons.urls.entity },
      classes: "btn-outline-primary",
    },
    onclick: async function (e) {
      let trace = 0,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;
      if (trace) {
        debugger;
      }
    }, //onclick
  };
  if (button.reg.attributes.href != naviButtons.urls.currPage) {
    naviButtons.reg.regs[button.reg.id] = button;
  }

  // -------------  buttonTasks ------------
  button = {
    //container: processMan.buttons.container,
    // parent: n
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonTasks",
      //ln: ln + this.id,
      header: { ua: `Програма`, en: `Program`, ru: `Программа` },
      type: "button",
      comment: {
        ua: `Редагувати програму`,
        en: `Edit program`,
        ru: `Редактировать програму`,
      },
      //classes: "border fw-bold",
      attributes: { href: naviButtons.urls.tasks },
      classes: "btn-outline-primary",
    },
    onclick: async function (e) {
      let trace = 0,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;
      if (trace) {
        debugger;
      }
    }, //onclick
  };
  if (button.reg.attributes.href != naviButtons.urls.currPage) {
    naviButtons.reg.regs[button.reg.id] = button;
  }

  // -------------  buttonLogger ------------
  button = {
    //container: processMan.buttons.container,
    // parent: n
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonLogger",
      //ln: ln + this.id,
      header: { ua: `Архів`, en: `Records`, ru: `Архив` },
      type: "button",
      comment: {
        ua: `Архів процесів та звіти`,
        en: `Records of processes and reports`,
        ru: `Просмотр архивов и отчеті`,
      },
      //classes: "border fw-bold",
      attributes: { href: naviButtons.urls.logger },
      classes: "btn-outline-primary",
    },
    onclick: async function (e) {
      let trace = 0,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;
      if (trace) {
        debugger;
      }
    }, //onclick
  };
  if (button.reg.attributes.href != naviButtons.urls.currPage) {
    naviButtons.reg.regs[button.reg.id] = button;
  }

  trace = 0;
  if (trace) {
    console.log(naviButtons.ln + `naviButtons=`);
    console.dir(naviButtons);
  }

  naviButtons.elements = new myElementsRender[naviButtons.reg.type](
    naviButtons
  ).children;
} // опис кнопок
