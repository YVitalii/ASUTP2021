/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const pug = require("pug");

const log = require("../../tools/log.js");

const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassTaskThermal = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermal.js");
const ClassDevicesManager = require("../../devices/devicesManager/ClassDevicesManager.js");
const ClassProcessManager = require("../../processes/processManager/ClassProcessManager.js");
const ClassLoggerManager = require("../../controllers/loggerManager/ClassLoggerManager.js");
const pathResolve = require("path").resolve;
const pathJoin = require("path").join;
const pathNormalize = require("path").normalize;

//const ThermStep = require("./program/thermStep/ClassThermProcessStep.js");

const emulate = 0; //true;

let TRP08, ifaceW2;

if (emulate) {
  TRP08 = require("../../devices/ClassTemperatureEmulator.js");
} else {
  ifaceW2 = require("../../conf_iface.js").w2;
  TRP08 = require("../../devices/trp08/manager.js");
}

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

entity.id = "furnace2024";

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

let dev1, dev2;
if (emulate) {
  // емулятор терморегулятора
  dev1 = new TRP08({
    id: "trp08n1",
    heating: { time: 30, tT: entity.maxT - 25 },
  });
  dev2 = new TRP08({
    id: "trp08n2",
    heating: { time: 25, tT: entity.maxT - 25 },
  });
  dev1.start();
  entity.devicesManager.addDevice(dev1.id, dev1);
  // dev2.start();
  //entity.devicesManager.addDevice(dev2.id, dev2);
} else {
  dev1 = new TRP08(ifaceW2, 1, { id: "trp08n1" });
  entity.devicesManager.addDevice(dev1.id, dev1);
}

// let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2" });
// entity.devicesManager.addDevice(dev2.id, dev2);

// let dev3 = new TRP08(ifaceW2, 3, { id: "trp08n3" });
// entity.devicesManager.addDevice(dev3.id, dev3);

//entity.devices.addDevice("trp08-2", new TRP08(ifaceW2, 2));
// log("i", `entity.devices=`);
// console.dir(entity.devicesManager);

// задача термообробка
let taskThermal = new ClassTaskThermal({
  maxT: entity.maxT,
  devices: [entity.devicesManager.getDevice(dev1.id)],
  firstWave: {
    period: 10, //період між запитами
    //points:10, //кількість точок вимірювання
    // dT:0.1, // середня похідна за 10 точок
  },
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

entity.loggerManager = new ClassLoggerManager({
  ln: entity.id + "::loggerManager()::",
  baseUrl: entity.homeUrl,
  baseDir: entity.homeDir,
  period: emulate ? 1 * 1000 : 10 * 1000, // для пришвидшення тестування 1 c
  regs: [
    {
      id: "T1",
      units: { ua: `C`, en: `C`, ru: `C` },
      header: {
        ua: `T1`,
        en: `T1`,
        ru: `T1`,
      },
      comment: {
        ua: `Поточна температура в зоні №1`,
        en: `Current temperature in zone 1`,
        ru: `Текущая температура в зоне №1`,
      },
      getValue: async () => {
        return await entity.devicesManager.getDevice("trp08n1").getT();
      },
    },
    {
      id: "tT",
      units: { ua: `C`, en: `C`, ru: `C` },
      header: {
        ua: `Завдання`,
        en: `task T`,
        ru: `Задание`,
      },
      comment: {
        ua: `Поточна температура в зоні №2`,
        en: `Current temperature in zone 2`,
        ru: `Текущая температура в зоне №2`,
      },
      getValue: async () => {
        let res = await entity.devicesManager
          .getDevice("trp08n1")
          .getParams("tT");
        //console.log(`res=`);
        //console.dir(res);
        return res.tT.value;
      },
    },
  ],
}); //entity.loggerManager = new LoggerManager

// log("i", `entity.loggerManager=`);
// console.dir(entity.loggerManager);

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
entity.getFullHtml = (req) => {
  let trace = 1,
    ln = gln + "htmlComponent.full::";
  trace ? log("i", ln, `entity.fullName.ua=`, entity.fullName.ua) : null;
  let html = pug.renderFile(
    req.locals.homeDir + "/entities/general/views/mainTemplate1.pug",
    {
      entity: this,
      lang: req.user.lang,
    }
  );
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
