// cd ./tests/testEntity
// supervisor --no-restart-on exit ./entity.js

// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");
// const dummy = require("../../tools/dummy.js").dummyPromise;
const log = require("../../tools/log.js");
let trace = 1,
  gLn = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "PES-3-2",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "ПЕС-3/1000-2",
  en: "PES-3/1000-2",
  ru: "ПЕС-3/1000-2",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Електропіч " + props.shortName.ua,
  en: "Furnace " + props.shortName.en,
  ru: "Електропечь " + props.shortName.ru,
};

// -- максимальна температура в печі required {Number}
props.maxT = 1000;
if (trace) {
  log("i", gLn, `props=`);
  console.dir(props);
}

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
// const TRM251 = require("../../devices/OWEN_TRM251/manager.js");
// --- створюємо та реєструємо прилад №1 - верхня зона той що стоїть в печі
let settings = {
  id: "furnace1",
  addT: 0,
  emulator: {
    // налаштування емулятора приладу
    minT: 0, // мінімальна температура печі для PID inputRange
    maxT: props.maxT, // максимальна температура печі для PID inputRange
    pid: undefined, // налаштування емулятора pid-регулятора
    furnace: undefined, // налаштування емулятора печі ClassFurnaceModel.js
  },
};
// --------- нижня зона -------------------
let furnace1 = new TRP08(ifaceW2, 1, settings);
entity.devicesManager.addDevice(settings.id, furnace1);
// --------- середня зона -------------------
settings.id = "furnace2";
settings.addT = 3;
let furnace2 = new TRP08(ifaceW2, 2, settings);
entity.devicesManager.addDevice(settings.id, furnace2);
// --------- середня зона -------------------
settings.id = "furnace3";
settings.addT = 6;
let furnace3 = new TRP08(ifaceW2, 3, settings);
entity.devicesManager.addDevice(settings.id, furnace3);

// let furnaceUp = new TRP08(ifaceW2, 1, { id: "furnace", addT: 0 });

// let furnace = new TRM251({ iface: ifaceW2, addr: 1, id: "furnace", addT: 0 });

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
taskThermal.addDevice(furnace1);
// taskThermal.addDevice(dev2);

// --------------  налаштування менеджера логування процесу ----------------------
var logger = entity.loggerManager;
let units = { ua: `°C`, en: `°C`, ru: `°C` };
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
    ua: `Цільова температура`,
    en: `Target temperature`,
    ru: `Заданная температура`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    let trace = 0,
      ln = entity.ln + `getValue(tT)::`;
    let res = await entity.devicesManager.getDevice("furnace1").getParams("tT");
    if (trace) {
      console.log(ln + `res.tT=`);
      console.dir(res.tT);
    }
    return res.tT.value;
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
    ua: `Низ. Поточна температура.`,
    en: `Bottom. Current temperature.`,
    ru: `Низ. Текущая температура в печи`,
  },

  getValue: async () => {
    // повинна повертати числове значення регістру
    let t = await entity.devicesManager.getDevice("furnace1").getT(); //TRM251
    // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
    return t;
  },
}); //logger.addReg(id: "T1"

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "T2",
  units,
  header: {
    ua: `T2`,
    en: `T2`,
    ru: `T2`,
  },
  comment: {
    ua: `Центр. Поточна температура.`,
    en: `Middle. Current temperature.`,
    ru: `Центр. Текущая температура в печи`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    let t = await entity.devicesManager.getDevice("furnace2").getT(); //TRM251
    // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
    return t;
  },
}); //logger.addReg(id: "T2"

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "T3",
  units,
  header: {
    ua: `T3`,
    en: `T3`,
    ru: `T3`,
  },
  comment: {
    ua: `Верх. Поточна температура.`,
    en: `Top. Current temperature.`,
    ru: `Верх. Текущая температура в печи`,
  },

  getValue: async () => {
    // повинна повертати числове значення регістру
    let t = await entity.devicesManager.getDevice("furnace3").getT(); //TRM251
    // let t = await entity.devicesManager.getDevice("furnace").getT(); //TRP08
    return t;
  },
}); //logger.addReg(id: "T3"

// ----------------2025-10-01 ---------------
// // ---- додаємо регістр для логування + його опис
// logger.addReg({
//   id: "T0",
//   units,
//   header: {
//     ua: `T0`,
//     en: `T0`,
//     ru: `T0`,
//   },
//   comment: {
//     ua: `Температура в точці N0`,
//     en: `Current temperature in point N0`,
//     ru: `Текущая температура в точке N0`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     return await entity.devicesManager.getDevice("trp08n2").getT();
//   },
// }); //logger.addReg(

// // ---- додаємо регістр для логування + його опис
// for (let i = 1; i < 9; i++) {
//   let reg = {
//     id: `T${i}`,
//     units,
//     header: {
//       ua: `T${i}`,
//       en: `T${i}`,
//       ru: `T${i}`,
//     },
//     comment: {
//       ua: `AI0${i}`,
//       en: `AI0${i}`,
//       ru: `AI0${i}`,
//     },
//     getValue: async () => {
//       let ln = this.id + "::getValue()::";
//       let res;
//       try {
//         res = await entity.devicesManager
//           .getDevice("mb110")
//           .getRegister(`T${i}`);
//       } catch (error) {
//         log("e", ln, error);
//         throw error;
//       }
//       if (res != null) {
//         res = res.toFixed(1);
//       }
//       // let baseT = await entity.devicesManager.getDevice("trp08n2").getT();
//       return res; // повертаємо результат
//     },
//   };
//   if (i === 0) {
//     reg.getValue = async () => {
//       return await entity.devicesManager.getDevice("trp08n2").getT();
//     };
//   }
//   logger.addReg(reg);
// } // for

// console.log("logger=");
// console.dir(logger);

// logger.addReg({
//   id: "T0",
//   units,
//   header: {
//     ua: `T0`,
//     en: `T0`,
//     ru: `T0`,
//   },
//   comment: {
//     ua: `Поточна температура в точці печі`,
//     en: `Current temperature in furnace`,
//     ru: `Текущая температура в печи`,
//   },
//   getValue: async () => {
//     // повинна повертати числове значення регістру
//     return await entity.devicesManager.getDevice("trp08furnace").getT();
//   },
// });

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
    ln = entity.ln + `entity.js.processManager.afterAll()::`;
  if (trace) {
    console.log(ln + `entity.id=${entity.id}`);
    //console.dir(this, { depth: 1, colors: true });
  }
  let dev = this.devicesManager.getDevice("furnace1");

  if (!dev) {
    log("e", ln + `Device furnace not found!`);
    return;
  }
  if (trace) {
    console.log(ln + `dev=`);
    console.dir(dev);
  }
  // ---- зупиняємо нагрівання
  // ---- ця дія дозволяє ввімкнути дзвіно через 1 хв після закінчення програми
  // ---- якщо цієї дії немає - то кінець програми на терморегуляторі ТРП не призводить
  // ---- до ввімкнення звукового сигналу
  // await dev.setOutput(0);
  await dev.start({ tT: 20, H: 0, Y: 1, o: 2 });
  return;
  // ---- запускаємо менеджер процесів
};

module.exports = entity;

// --------- для контролю створеного об'єкту ------------
trace = 0;
if (trace) {
  console.log(gLn + `entity.processManager=`);
  console.dir(entity.processManager, { depth: 2, colors: true });
  // entity.processManager.afterAll();
}

if (!module.parent) {
  // (async () => {
  //   await dummy(5000);
  //   let regs = entity.loggerManager.regs;
  //   while (true) {
  //     regs["T0"].getValue().then((res) => {
  //       console.log("T0=", res);
  //     });
  //     regs["T1"].getValue().then((res) => {
  //       console.log("T1=", res);
  //     });
  //     regs["T2"].getValue().then((res) => {
  //       console.log("T2=", res);
  //     });
  //     await dummy(4000);
  //   } // while
  // })();
}
