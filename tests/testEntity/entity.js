// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");

let trace = 0,
  gln = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "SshAM-7-12)7_2024",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "СШАМ-7.12/7",
  en: "SShAM-7.12/7",
  ru: "СШАМ-7.12/7",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Піч СШАМ-7.12/7 інв.№210423",
  en: "Furnace SShAM-7.12/7 s/n:210423",
  ru: "Печь СШАМ-7.12/7 инв.№210423",
};

// -- максимальна температура в печі required {Number}
props.maxT = 750; // C

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
// --- створюємо та реєструємо прилад №1
let dev1 = new TRP08({ iface: ifaceW2, addr: 1, id: "trp08f", addT: 0 });
entity.devicesManager.addDevice(dev1.id, dev1);
// --- створюємо та реєструємо прилад №2
let dev2 = new TRP08({ iface: ifaceW2, addr: 2, id: "trp08r", addT: 0 });
entity.devicesManager.addDevice(dev2.id, dev2);

// --------------  налаштування менеджера термічного процесу ----------------------
let taskThermal = entity.tasksManager.getTask("taskThermal");
// додаємо прилади, що беруть участь в процесі
taskThermal.addDevice(dev1);
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
    let res = await entity.devicesManager.getDevice("trp08r").getParams("tT");
    if (trace) {
      console.log(ln + `res.tT=`);
      console.dir(res.tT);
    }
    return res.tT;
  },
}); //logger.addReg(

// // ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "Tr",
  units,
  header: {
    ua: `T рет`,
    en: `T ret`,
    ru: `T рет`,
  },
  comment: {
    ua: `Поточна температура в реторті`,
    en: `Current temperature in retort`,
    ru: `Текущая температура в реторте`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    return await entity.devicesManager.getDevice("trp08r").getT();
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "Tf",
  units: { ua: `°C`, en: `°C`, ru: `°C` },
  header: {
    ua: `T печі`,
    en: `T furnace`,
    ru: `T печи`,
  },
  comment: {
    ua: `Поточна температура в печі`,
    en: `Current temperature in furnace`,
    ru: `Текущая температура в печи`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    return await entity.devicesManager.getDevice("trp08f").getT();
  },
});

module.exports = entity;

// --------- для контролю створеного об'єкту ------------
if (trace) {
  console.log(gln + `entity.devicesManager=`);
  console.dir(entity.devicesManager, { depth: 3 });
}
