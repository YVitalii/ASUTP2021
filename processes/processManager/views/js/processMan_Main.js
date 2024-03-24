/** Виконує базові налаштування панелі керування програмою */

processMan.myElementsRender = myElementsRender;
//  контейнер де буде розташовуватися менеджер програми
processMan.container = document.getElementById("Process_buttonGroup");
processMan.id = "taskBar";
// список всіх елементів контейнеру
processMan.buttonsGroup = {};
// кнопка "Редагувати завдання"
{
  let row = document.createElement("div");
  row.classList.add("row");
  processMan.container.appendChild(row);

  let ln = "processMan_Main.js::";
  let props = {
    id: "taskBar",
    prefix: "taskBar",
    container: row,
    regs: {},
    type: "regsList",
  };
  let button = {
    container: row,
    parent: processMan,
    action: "link", // default= "button" or "link"
    reg: {
      id: "buttonEditTask",
      ln: ln + this.id,
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
  props.regs[button.id] = button;

  processMan.elements[props.id] = new processMan.myElementsRender[
    button.reg.type
  ](button);
}
