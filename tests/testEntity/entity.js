// cd ./tests/testEntity
// supervisor --timestamp --no-restart-on exit ./entity.js

// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");

const dummy = require("../../tools/dummy.js").dummyPromise;
const log = require("../../tools/log.js");
let trace = 0,
  gln = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "SNO-6-6-4)6_2025",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "СНО-6.6.4/4ГЦ",
  en: "SNO-6.6.4/4GC",
  ru: "СНО-6.6.4/4ГЦ",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Електропіч СНО-6.6.4/4ГЦ",
  en: "Furnace SNO-6.6.4/4GC",
  ru: "Електропечь СНО-6.6.4/4ГЦ",
};

// -- максимальна температура в печі required {Number}
props.maxT = 400;

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
const TRM251 = require("../../devices/OWEN_TRM251/manager.js");
// --- створюємо та реєструємо прилад №1 - той що стоїть в печі
// let furnace = new TRP08(ifaceW2, 1, { id: "furnace", addT: 0 });
let furnace = new TRM251({ iface: ifaceW2, addr: 1, id: "furnace", addT: 0 });

entity.devicesManager.addDevice(furnace.id, furnace);

// // --- створюємо та реєструємо прилад №2 -  центр камери
// let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2", addT: 0 });
// entity.devicesManager.addDevice(dev2.id, dev2);

// --- створюємо та реєструємо прилад №3 -  MB110-8A
// const MB110 = require("../../devices/OWEN_MB110-8A/manager.js");
// let dev3 = new MB110({ iface: ifaceW2, addr: 16, id: "mb110", addT: 0 });
// entity.devicesManager.addDevice(dev3.id, dev3);

// --------------  налаштування менеджера термічного процесу ----------------------
let taskThermal = entity.tasksManager.getTask("taskThermal");
// додаємо прилади, що беруть участь в процесі
// console.log("dev3=", dev3.id);
// console.dir(dev3);
taskThermal.addDevice(furnace);
// taskThermal.addDevice(dev2);

// --------------  налаштування менеджера логування процесу ----------------------
var logger = entity.loggerManager;
let units = { ua: `°C`, en: `°C`, ru: `°C` };
// // ---- додаємо регістр для логування + його опис
// logger.addReg({
//   id: "tT",
//   units,
//   header: {
//     ua: `Ціль`,
//     en: `Goal`,
//     ru: `Цель`,
//   },
//   comment: {
//     ua: `Цільова температура`,
//     en: `Target temperature`,
//     ru: `Заданная температура`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     let trace = 0,
//       ln = entity.ln + `getValue(tT)::`;
//     let res = await entity.devicesManager
//       .getDevice("trp08furnace")
//       .getParams("tT");
//     if (trace) {
//       console.log(ln + `res.tT=`);
//       console.dir(res.tT);
//     }
//     return res.tT.value;
//   },
// }); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "T1",
  units,
  header: {
    ua: `Піч`,
    en: `Furnace`,
    ru: `Печь`,
  },
  comment: {
    ua: `Поточна температура в печі`,
    en: `Current temperature in furnace`,
    ru: `Текущая температура в печи`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    let t = await entity.devicesManager.getDevice("furnace").getRegister("T1"); //TRM251
    // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
    return t;
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "tT",
  units,
  header: {
    ua: `Ціль`,
    en: `Goal`,
    ru: `Цель`,
  },
  comment: {
    ua: `Поточне значення уставки`,
    en: `Current set point`,
    ru: `Текущее задание`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    let t = await entity.devicesManager.getDevice("furnace").getRegister("tT"); //TRM251
    // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
    t = t == null ? 0 : t;
    return t;
  },
}); //logger.addReg(
// // ---- додаємо регістр для логування + його опис
// logger.addReg({
//   id: "mode",
//   units,
//   header: {
//     ua: `Стан`,
//     en: `Mode`,
//     ru: `Состояние`,
//   },
//   comment: {
//     ua: `Стан приладу`,
//     en: `Device's mode`,
//     ru: `Состояние прибора`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     let t = await entity.devicesManager.getDevice("furnace").getRegister("mode"); //TRM251
//     // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
//     return t;
//   },
// }); //logger.addReg(

entity.processManager.afterAll = async function () {
  // функція, що викликається після завершення всієї програми
  // let trace = 1,
  //   ln = entity.ln + `afterAll()::`;
  // if (trace) {
  //   log("w", ln + `entity.id=${entity.id}. Started`);
  //   //console.dir(this, { depth: 1, colors: true });
  // }
  // let dev = this.devicesManager.getDevice("furnace");
  // if (!dev) {
  //   log("e", ln + `Device furnace not found!`);
  //   return;
  // }
  // ---- зупиняємо нагрівання
  // await dev.setOutput(0);
  // await dev.start({ tT: 20, H: 0, Y: 1, o: 2 });
  return;
  // ---- запускаємо менеджер процесів
};

module.exports = entity;

// --------- для контролю створеного об'єкту ------------
trace = 1;
if (trace) {
  console.log(gln + `entity.processManager=`);
  // console.dir(entity.processManager, { depth: 2, colors: true });
  // entity.processManager.afterAll();
}

if (!module.parent) {
  (async () => {
    await dummy(5000);
    let regs = entity.loggerManager.regs;
    while (true) {
      regs["T1"].getValue().then((res) => {
        console.log("T1=", res);
      });
      regs["tT"].getValue().then((res) => {
        console.log("tT=", res);
      });
      // regs["T2"].getValue().then((res) => {
      //   console.log("T2=", res);
      // });
      // regs["mode"].getValue().then((res) => {
      //   console.log("mode=", res);
      // });
      await dummy(4000);
    } // while
  })();
}
