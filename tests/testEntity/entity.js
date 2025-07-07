// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");

let trace = 0,
  gln = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "SSHO-9-9-21)6GC",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "СШО 9.9.21/6ГЦ",
  en: "SSHO-9.9.21/6GC",
  ru: "СШО 9.9.21/6ГЦ",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Піч СШО 9.9.21/6ГЦ інв.№201224",
  en: "Furnace SSHO-9.9.21/6GC s/n:201224",
  ru: "Печь СШО 9.9.21/6ГЦ инв.№201224",
};

// -- максимальна температура в печі required {Number}
props.maxT = 650;

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
// --- створюємо та реєструємо прилад №1
let dev1 = new TRP08(ifaceW2, 1, { id: "trp08n1", addT: 0 });
entity.devicesManager.addDevice(dev1.id, dev1);
// --- створюємо та реєструємо прилад №2
// let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2", addT: 0 });
// entity.devicesManager.addDevice(dev2.id, dev2);

// --------------  налаштування менеджера термічного процесу ----------------------
let taskThermal = entity.tasksManager.getTask("taskThermal");
// додаємо прилади, що беруть участь в процесі
taskThermal.addDevice(dev1);
// taskThermal.addDevice(dev2);

// --------------  налаштування менеджера логування процесу ----------------------
var logger = entity.loggerManager;
let units = { ua: `°C`, en: `°C`, ru: `°C` };
// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "tT",
  units,
  header: {
    ua: `Завдання`,
    en: `Task`,
    ru: `Задание`,
  },
  comment: {
    ua: `Цільова температура`,
    en: `Target temperature`,
    ru: `Заданная температура`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    let trace = 0,
      ln = entity.ln + `getValue(tT)::`;
    let res = await entity.devicesManager.getDevice("trp08n1").getParams("tT");
    if (trace) {
      console.log(ln + `res.tT=`);
      console.dir(res.tT);
    }
    return res.tT;
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "T1",
  units,
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
    // повинна повертати числове значення регістру
    return await entity.devicesManager.getDevice("trp08n1").getT();
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
// logger.addReg({
//   id: "T2",
//   units: { ua: `C`, en: `C`, ru: `C` },
//   header: {
//     ua: `T2`,
//     en: `T2`,
//     ru: `T2`,
//   },
//   comment: {
//     ua: `Поточна температура в зоні №2`,
//     en: `Current temperature in zone 2`,
//     ru: `Текущая температура в зоне №2`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     return await entity.devicesManager.getDevice("trp08n2").getT();
//   },
// });
entity.processManager.afterAll = async function () {
  // функція, що викликається після завершення всієї програми
  let trace = 1,
    ln = entity.ln + `afterAll()::`;
  if (trace) {
    console.log(ln + `entity.id=${entity.id}`);
    console.dir(this, { depth: 1, colors: true });
  }
  this.devicesManager.getDevice("trp08n1").setParams({ tT: 0, H: 0, Y: 0 });
  // ---- запускаємо менеджер процесів
};

module.exports = entity;

// --------- для контролю створеного об'єкту ------------
trace = 1;
if (trace) {
  console.log(gln + `entity.processManager=`);
  // console.dir(entity.processManager, { depth: 2, colors: true });
  entity.processManager.afterAll();
}
