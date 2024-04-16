// список всіх кнопок

{
  let btnGr = processMan.buttons;
  btnGr.ln = "processMan.buttonsGroup()";
  let buttons = {
    types: processMan.myElementsRender,
    prefix: "taskBar",
    container: processMan.buttons.container,
    reg: {
      type: "buttonGroup",
      id: "taskBar",
      ln: "",
      regs: {},
    },
  };
  // -------------  buttonEditTask ------------
  let button = {
    //container: processMan.buttons.container,
    parent: processMan,
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonEditTask",
      //ln: ln + this.id,
      header: { ua: `Задача`, en: `Task`, ru: `Задание` },
      type: "button",
      comment: {
        ua: `Редагування задачі`,
        en: `Edit task`,
        ru: `Редактирование задания`,
      },
      classes: "btn-primary",
      attributes: { href: processMan.editTaskUrl },
      onclick: async function (e) {
        let trace = 1,
          ln = `${this.el.id}::Was pressed!!`;
        trace ? console.log(ln) : null;
      },
    },
  };
  buttons.reg.regs[button.reg.id] = button;
  // -------------  buttonStart ------------
  button = {
    //container: processMan.buttons.container,
    parent: processMan,
    action: "button", // default= "button" or "link"
    reg: {
      id: "buttonStart",
      //ln: ln + this.id,
      header: { ua: `Виконати`, en: `Start`, ru: `Выполнить` },
      type: "button",
      comment: {
        ua: `Виконання завдання`,
        en: `Running task`,
        ru: `Выполнение задания`,
      },
      classes: "btn-success",
      attributes: { href: processMan.homeUrl + "start" },
    },
    onclick: async function (e) {
      let trace = 1,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;

      let state = processMan.program.tasks;
      //debugger;
      if (state._id == "going") {
        let msg = {
          ua: `Дійсно бажаєте зупинити програму?`,
          en: `Do you really want to stop the program?`,
          ru: `Вы действительно хотите остановить программу?`,
        }[lang];
        if (confirm(msg)) {
          // зупиняємо програму
          try {
            await this.parent.program.stop();
            //return;
          } catch (error) {}
        }
      } //if (state._id != "going")

      if (state._id != "going") {
        let msg = {
          ua: `Дійсно бажаєте запустити виконання програми?`,
          en: `Do you really want to start the program?`,
          ru: `Вы действительно хотите запустить программу?`,
        }[lang];
        if (confirm(msg)) {
          // зупиняємо програму
          try {
            await processMan.program.start();
            //return;
          } catch (error) {}
        }
      } //if (state._id != "going")
    }, //onclick
  };
  buttons.reg.regs[button.reg.id] = button;

  if (trace) {
    console.log(btnGr.ln + `buttons=`);
    console.dir(buttons);
  }
  btnGr.elements = new processMan.myElementsRender[buttons.reg.type](buttons);
}
