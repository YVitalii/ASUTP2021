/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const path = require("path");
const pug = require("pug");
const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassTaskThermal = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermal.js");
const ClassProcessManager = require("../../processes/processManager/ClassProcessManager.js");
const ClassDevicesManager = require("../../devices/devicesManager/ClassDevicesManager.js");
const ClassLoggerManager = require("../../controllers/loggerManager/ClassLoggerManager.js");
//const ThermStep = require("./program/thermStep/ClassThermProcessStep.js");
const log = require("../../tools/log.js");

const emulate = true;

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
entity.homeDir = __dirname + path.sep;

entity.id = "SDO-15.15.15)5_2023";

let trace = 1,
  gln = `${entity.id}::entity.js::`;

// Максимальна температура в печі + 50
entity.maxT = 500 + 50;

// URL адреса гілки
entity.homeUrl = entity.id + "/";

// завантажуємо пристрої

entity.devices = require("./devices/devices.js");

entity.devicesManager = new ClassDevicesManager({
  baseUrl: "/" + entity.homeUrl,
});

entity.loggerManager = new ClassLoggerManager({
  ln: entity.id + "::loggerManager()::",
  baseUrl: "/" + entity.homeUrl,
  baseDir: entity.homeDir,
  period: 10 * 1000,
  regs: [],
});

// менеджер завдань
entity.tasksManager = new TasksManager({
  ln: entity.id + "::TasksManager::",
  homeDir: entity.homeDir,
  homeURL: entity.homeUrl,
});
// -- термічний процесс
let thermalProcess = new ClassTaskThermal({
  maxT: entity.maxT,
  emulate,
  quickHeating: {
    beforeStart: async function (regs) {
      console.log(`${entity.id}, quickHeating.beforeStart !`);
    },
    heatingPID: async function (regs) {
      console.log(`${entity.id}, heatingPID.beforeStart !`);
    },
    holding: async function (regs) {
      console.log(`${entity.id}, holding.beforeStart !`);
    },
  },
});

// реєструємо задачу термообробки в менеджері програм
entity.tasksManager.addType(thermalProcess);

entity.processManager = new ClassProcessManager({
  homeDir: entity.homeDir,
  homeUrl: entity.homeUrl,
  tasksManager: entity.tasksManager,
  loggerManager: entity.loggerManager,
  devicesManager: entity.devicesManager,
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
