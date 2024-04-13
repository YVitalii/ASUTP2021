/** Виконує базові налаштування панелі керування програмою */

processMan.myElementsRender = myElementsRender;

// список всіх елементів контейнеру
processMan.buttonsGroup = {};
// кнопка "Редагувати завдання"
{
  processMan.program.getList = async () => {
    let trace = 1,
      ln = "getList()::";
    trace ? console.log(ln + `Started`) : null;
    let response = await fetch(processMan.homeUrl + "getProgramList", {
      method: "post",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    }); //
    if (response.ok) {
      // очищуємо контейнер
      processMan.program.container.innerHTML = "";
      processMan.program.list = await response.json();
      if (trace) {
        console.log(ln + `processMan.program.list=`);
        console.dir(processMan.program.list);
      }
      processMan.program.renderList();
    } else {
      console.warn(ln + response.status);
    }
  };

  processMan.program.renderSteps = (container, item) => {
    if (Array.isArray(item)) {
      let row = document.createElement("div");
      row.classList.add("row");
      container.appendChild(row);
      for (let index = 0; index < item.length; index++) {
        processMan.program.renderSteps(row, item[index]);
      }
    } else {
      // let col = document.createElement("div");
      // col.classList.add("col");
      // рендеримо задачу
      container.appendChild(
        new processMan.myElementsRender["step"]({
          container: container,
          reg: item,
        }).div
      );
      // let task = new processMan.myElementsRender (

      // )
    }
  };
  processMan.program.renderList = () => {
    let list = processMan.program.list;
    for (let i = 1; i < list.length; i++) {
      let row = document.createElement("div");
      row.classList.add("row", "border", "border-1", "border-secondary");
      processMan.program.renderSteps(row, processMan.program.list[i]);
      processMan.program.container.appendChild(row);
    }
  };

  setTimeout(() => {
    processMan.program.getList();
  }, 3000);

  //JSON.parse("!{JSON.stringify(processMan.htmlProgram)}");

  // let row = document.createElement("div");
  // row.classList.add("row");
  // processMan.container.appendChild(row);

  // let ln = "processMan_Main.js::";
  // let props = {
  //   id: "taskBar",
  //   prefix: "taskBar",
  //   container: row,
  //   regs: {},
  //   type: "regsList",
  // };
  // let button = {
  //   container: row,
  //   parent: processMan,
  //   action: "link", // default= "button" or "link"
  //   reg: {
  //     id: "buttonEditTask",
  //     ln: ln + this.id,
  //     header: { ua: `Задача`, en: `Task`, ru: `Задание` },
  //     type: "button",
  //     comment: {
  //       ua: `Редагування задачі`,
  //       en: `Edit task`,
  //       ru: `Редактирование задания`,
  //     },
  //     classes: "btn-primary",
  //     attributes: { href: processMan.editTaskUrl },
  //     onclick: async function (e) {
  //       let trace = 1,
  //         ln = `${this.el.id}::Was pressed!!`;
  //       trace ? console.log(ln) : null;
  //     },
  //   },
  // };
  // props.regs[button.id] = button;
  // processMan.elements = {};
  // processMan.elements[props.id] = new processMan.myElementsRender[
  //   button.reg.type
  // ](button);
}
