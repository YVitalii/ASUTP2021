// контейнери з такими id мають бути розташовані на сторінці
// див. loggerFull.pug
logMan.tasks = {};
logMan.tasks.data;
logMan.tasks.tasksName = {
  container: document.getElementById("tasksName"),
};
logMan.tasks.tasksStarted = {
  container: document.getElementById("tasksStarted"),
};
logMan.tasks.tasksNote = new myElementsRender["textarea"]({
  container: document.getElementById("tasksNote"),
  reg: {
    id: "description",
    ln: "logMan.tasks.tasksNote::",
    header: { ua: `Примітки:`, en: `Notes:`, ru: `Примечания:` },
    comment: { ua: ``, en: ``, ru: `` },
    type: "textarea",
    value: "",
    attributes: { rows: 4 },
  },
});

logMan.tasks.render = () => {
  if (!logMan.tasks.data) {
    return;
  }
  let data = logMan.tasks.data[0];
  let name = data.name ? data.name : "___________";
  logMan.tasks.tasksName.container.innerHTML = name;
  let started = new Date(data.started).toLocaleString();
  started = started == "Invalid Date" ? "___________" : started;
  logMan.tasks.tasksStarted.container.innerHTML = started;
  let note = data.note ? data.note : "";
  logMan.tasks.tasksNote.setValue(note);
  // let description = new myElementsRender["textarea"]({
  //   container: logMan.tasks.tasksNote.container,

  // });
  // logMan.tasks.tasksNote.el = description;
};
