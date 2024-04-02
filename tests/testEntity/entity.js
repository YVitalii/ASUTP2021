/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const pug = require("pug");
const ifaceW2 = require("../../conf_iface.js").w2;

const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassTaskThermal = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermal.js");
const ClassDevicesManager = require("../../devices/devicesManager/ClassDevicesManager.js");
const ClassProcessManager = require("../../processes/processManager/ClassProcessManager.js");

const TRP08 = require("../../devices/trp08/manager.js");
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
entity.homeDir = __dirname + "\\";

entity.id = "testEntity_2023";

let trace = 0,
  gln = `${entity.id}::entity.js::`;

// Максимальна температура в печі + 50
entity.maxT = 150;

// URL адреса гілки
entity.homeUrl = "/entity/" + entity.id + "/";

// завантажуємо пристрої

entity.devicesManager = new ClassDevicesManager({
  baseUrl: entity.homeUrl,
});

let dev1 = new TRP08(ifaceW2, 1, { id: "trp08n1" });
entity.devicesManager.addDevice(dev1.id, dev1);

// let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2" });
// entity.devicesManager.addDevice(dev2.id, dev2);

// let dev3 = new TRP08(ifaceW2, 3, { id: "trp08n3" });
// entity.devicesManager.addDevice(dev3.id, dev3);

//entity.devices.addDevice("trp08-2", new TRP08(ifaceW2, 2));
// log("i", `entity.devices=`);
// console.dir(entity.devicesManager);

// крок термообробка
let taskThermal = new ClassTaskThermal({
  maxT: entity.maxT,
  devices: [entity.devicesManager.getDevice(dev1.id)],
});

// менеджер завдань
entity.tasksManager = new TasksManager({
  ln: entity.id + "::TasksManager::",
  homeDir: entity.homeDir,
  homeURL: entity.homeUrl,
});

// реєструємо задачу термообробки в менеджері завдань
entity.tasksManager.addType(taskThermal);

entity.processManager = new ClassProcessManager({
  homeDir: entity.homeDir,
  homeUrl: entity.homeUrl,
  tasksManager: entity.tasksManager,
  ln: entity.id + "::ProcessManager::",
});

// entity.processController = new ProgramController({
//   tasksManager: entity.tasksManager,
// });

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
  trace ? log("i", ln, `entity.fullName.ua=`, entity.fullName.ua) : null;

  let html = pug.renderFile(__dirname + "/views/full.pug", {
    entity: this,
    controllersButton: {
      href: entity.homeUrl,
      title: { ua: `Контролери`, en: `Controllers`, ru: `Контроллеры` },
      lang,
    },
    lang,
  });
  return html;
};

// entity.router = require(__dirname + "\\routes\\entityRouter.js");

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
