/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const pug = require("pug");

const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassTaskThermal = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermal.js");
//const ThermStep = require("./program/thermStep/ClassThermProcessStep.js");
const log = require("../../tools/log.js");

// об'єкт сутності
const entity = {};

// повна назва
entity.fullName = {
  ua: "Піч СДО 15.15.15/5.5ВЦ інв.№210423",
  en: "Furnace SDO-15.15.15/5,5VC s/n:210423",
  ru: "Печь СДО 15.15.15/5.5ВЦ инв.№210423",
};
// коротка назва
entity.shortName = {
  ua: "СДО 15.15.15/5.5ВЦ",
  en: "SDO-15.15.15/5,5VC",
  ru: "СДО 15.15.15/5.5ВЦ",
};

// id печі має співпадати з назвою теки в якій вона розташована
// TODO потрібно автоматизувати: використовувати в якості id імя батьківської теки
entity.homeDir = __dirname + "/";

entity.id = "SDO-15.15.15)5_2023";

let trace = 1,
  gln = `${entity.id}::entity.js::`;

// Максимальна температура в печі + 50
entity.maxT = 500 + 50;

// URL адреса гілки
entity.homeUrl = entity.id + "";

// завантажуємо пристрої

entity.devices = require("./devices/devices.js");

// менеджер програм
entity.tasksManager = new TasksManager({
  ln: entity.id + "::TasksManager::",
  homeDir: entity.homeDir + "/tasksManager",
  homeURL: entity.homeUrl + "/tasksManager",
});

// реєструємо задачу термообробки в менеджері програм
entity.tasksManager.addType(new ClassTaskThermal());

//  завантажуємо контролери
// entity.controllers = require("./controllers/controllers.js");

// ??? сутність де зберігається програма
// entity.program = new require("./program/program/ClassProgram.js");

// // тут зберігається програма
// entity.processes = {};
// // entity.processes.thermProcess = new ThermProcess();

// функція, що генерує HTML - код для відображення
// мінімізованого відображення печі в списку печей
entity.htmlCompact = (lang = "ua") => {
  let trace = 1,
    ln = gln + "htmlComponent.compact::";
  // if (trace) {
  //   log("i", ln, `entity=`);
  //   console.dir(entity);
  // }
  //   trace ? log("i", ln, `entity=`, entity) : null;
  let html = pug.renderFile(__dirname + "/views/compact.pug", { entity, lang });
  // trace ? log("i", ln, `html=`, html) : null;
  return html;
};

// функція, що генерує HTML - код для відображення
// головної сторінки печі
entity.htmlFull = (lang = "ua") => {
  let trace = 1,
    ln = gln + "htmlComponent.full::";
  //trace ? log("i", ln, `entity=`, entity) : null;

  let html = pug.renderFile(__dirname + "/views/full.pug", {
    entity,
    controllersButton: {
      href: entity.homeUrl,
      title: { ua: `Контролери`, en: `Controllers`, ru: `Контроллеры` },
      lang,
    },
    lang,
  });
  return html;
};

entity.router = require(__dirname + "\\routes\\entityRouter.js");

if (trace) {
  log("i", gln, `entity=`);
  console.dir(entity);
}

module.exports = entity;

if (!module.parent) {
  console.log("----------entity.js:: entity= ----------------------");
  console.dir(entity.process.fullHTML());
  //   console.dir(entity);
  //log(entity.html.compact());
  //log(entity.html.full());
}
