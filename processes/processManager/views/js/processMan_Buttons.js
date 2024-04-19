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
      classes: "btn-primary border fw-bold",
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
      header: { ua: `???`, en: `???`, ru: `???` },
      type: "button",
      comment: {
        ua: `Виконання завдання`,
        en: `Running task`,
        ru: `Выполнение задания`,
      },
      classes: "border fw-bold",

      attributes: { href: processMan.homeUrl + "start" },
    },
    onclick: async function (e) {
      let trace = 0,
        ln = `${this.el.id}::onclick::`;
      trace ? console.log(ln, "Was pressed!") : null;
      if (trace) {
        debugger;
      }

      let state = processMan.program.model;

      if (state._id == "going") {
        let msg = {
          ua: `Дійсно бажаєте зупинити програму?`,
          en: `Do you really want to stop the program?`,
          ru: `Вы действительно хотите остановить программу?`,
        }[lang];
        if (confirm(msg)) {
          // зупиняємо програму
          try {
            await processMan.program.stop();
            //return;
          } catch (error) {
            console.error(error);
          }
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
          } catch (error) {
            console.error(error);
          }
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

/** Періодично опитує стан процессу та, за потреби,  змінює зовнішній вигляд кнопки */
processMan.buttons.checkState = () => {
  //debugger;

  // елемент кнопки
  let el = processMan.buttons.elements.children["buttonStart"];
  // поточний стан процесу
  if (!processMan.program.model) return; // задачі ще не завантажено
  let newState = processMan.program.model._id == "going" ? "going" : "stoped";
  // попередній стан процесу
  let beforeState = el.state;
  // якщо стан не змінився - виходимо
  if (newState && beforeState != newState) {
    let states = {
      going: {
        classList: ["btn-warning", "text-dark"],
        innerHTML: { ua: `Стоп`, en: `Stop`, ru: `Стоп` },
      },
      stoped: {
        classList: ["btn-primary", "text-light"],
        innerHTML: { ua: `Пуск`, en: `Start`, ru: `Пуск` },
      },
    };
    if (states[beforeState]) {
      // видаляємо попередні класи
      states[beforeState].classList.map((c) => el.el.classList.remove(c));
    }
    //  додаємо нові класи
    states[newState].classList.map((c) => el.el.classList.add(c));
    // змінюємо напис
    el.el.innerHTML = states[newState].innerHTML[lang];
    // запамятовуємо новий стан
    el.state = newState;
  }
}; //processMan.buttons.checkState

// запускаємо періодичне опитування стану процесу
setInterval(() => {
  processMan.buttons.checkState();
}, 5000);
