// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");

let trace = 0,
  gln = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "SDO-15-20-15)11_2023",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "СДО 15.15.15/5.5ВЦ",
  en: "SDO-15.15.15/5,5VC",
  ru: "СДО 15.15.15/5.5ВЦ",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Піч СДО 15.15.15/5.5ВЦ інв.№210423",
  en: "Furnace SDO-15.15.15/5,5VC s/n:210423",
  ru: "Печь СДО 15.15.15/5.5ВЦ инв.№210423",
};

// -- максимальна температура в печі required {Number}
props.maxT = 150;

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
// --- створюємо та реєструємо прилад №1
// let dev1 = new TRP08(ifaceW2, 1, { id: "trp08n1", addT: 0 });
// entity.devicesManager.addDevice(dev1.id, dev1);
// --- створюємо та реєструємо прилад №2
let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2", addT: 0 });
entity.devicesManager.addDevice(dev2.id, dev2);

// --------------  налаштування менеджера термічного процесу ----------------------
let taskThermal = entity.tasksManager.getTask("taskThermal");
// додаємо прилади, що беруть участь в процесі
// taskThermal.addDevice(dev1);
taskThermal.addDevice(dev2);

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
    let res = await entity.devicesManager.getDevice("trp08n2").getParams("tT");
    if (trace) {
      console.log(ln + `res=`);
      console.dir(res);
    }

    return res.tT.value;
  },
}); //logger.addReg(

// // ---- додаємо регістр для логування + його опис
// logger.addReg({
//   id: "T1",
//   units,
//   header: {
//     ua: `T1`,
//     en: `T1`,
//     ru: `T1`,
//   },
//   comment: {
//     ua: `Поточна температура в зоні №1`,
//     en: `Current temperature in zone 1`,
//     ru: `Текущая температура в зоне №1`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     return await entity.devicesManager.getDevice("trp08n1").getT();
//   },
// }); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "T2",
  units: { ua: `C`, en: `C`, ru: `C` },
  header: {
    ua: `T2`,
    en: `T2`,
    ru: `T2`,
  },
  comment: {
    ua: `Поточна температура в зоні №2`,
    en: `Current temperature in zone 2`,
    ru: `Текущая температура в зоне №2`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    return await entity.devicesManager.getDevice("trp08n2").getT();
  },
});

module.exports = entity;

// --------- для контролю створеного об'єкту ------------
if (trace) {
  console.log(gln + `entity.devicesManager=`);
  console.dir(entity.devicesManager, { depth: 3 });
}
