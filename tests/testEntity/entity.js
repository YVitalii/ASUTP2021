// ----------- приклад опису сутності ----------------
const classEntityFurnace = require("../../entities/general/ClassEntityFurnace.js");
const dummy = require("../../tools/dummy").dummyPromise;

let trace = 0,
  gln = __filename + "::";

// ------ ідентифікатор печі,
// так як використовується в якості назви теки на диску та URL
// то не повинен містити в собі заборонені символи
let props = {
  id: "Calibrator_9points",
  homeDir: __dirname,
};

// -- коротке імя печі
props.shortName = {
  ua: "Калібратор 9 точок",
  en: "Calibrator_9points",
  ru: "Калибратор 9 точек",
};

// -- повне імя печі, якщо не вказано  props.fullName = props.shortName
props.fullName = {
  ua: "Калібратор 9 точок",
  en: "Calibrator_9points",
  ru: "Калибратор 9 точек",
};

// -- максимальна температура в печі required {Number}
props.maxT = 1100;

// -------- створюємо та повертаємо об'єкт печі
let entity = new classEntityFurnace(props);

// -----------------  налаштування приладів, що входять до складу печі ------------

// ------------- інтерфейс(и)
const ifaceW2 = require("../../conf_iface.js").w2;

// ----------------------------- прилади -----------------
// --- менеджери
const TRP08 = require("../../devices/trp08/manager.js");
// --- створюємо та реєструємо прилад №1 - той що стоїть в печі
let dev1 = new TRP08(ifaceW2, 1, { id: "trp08furnace", addT: 0 });
entity.devicesManager.addDevice(dev1.id, dev1);
// --- створюємо та реєструємо прилад №2 -  центр камери
let dev2 = new TRP08(ifaceW2, 2, { id: "trp08n2", addT: 0 });
entity.devicesManager.addDevice(dev2.id, dev2);
const MB110 = require("../../devices/OWEN_MB110-8A/manager.js");
const { dummyPromise } = require("../../tools/dummy.js");
// --- створюємо та реєструємо прилад №3 -  калібратор
let dev3 = new MB110({ iface: ifaceW2, addr: 16, id: "mb110", addT: 0 });
entity.devicesManager.addDevice(dev3.id, dev3);

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
    let res = await entity.devicesManager
      .getDevice("trp08furnace")
      .getParams("tT");
    if (trace) {
      console.log(ln + `res.tT=`);
      console.dir(res.tT);
    }
    return res.tT;
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
logger.addReg({
  id: "Tf",
  units,
  header: {
    ua: `Tf`,
    en: `Tf`,
    ru: `Tf`,
  },
  comment: {
    ua: `Поточна температура в печі`,
    en: `Current temperature in furnace`,
    ru: `Текущая температура в печи`,
  },
  getValue: async () => {
    // повинна повертати числове значення регістру
    return await entity.devicesManager.getDevice("trp08furnace").getT();
  },
}); //logger.addReg(

// ---- додаємо регістр для логування + його опис
for (let i = 0; i < 9; i++) {
  let reg = {
    id: `T${i}`,
    units,
    header: {
      ua: `T${i}`,
      en: `T${i}`,
      ru: `T${i}`,
    },
    comment: {
      ua: `Поточна температура в точці N${i}`,
      en: `Current temperature in point N${i}`,
      ru: `Текущая температура в точке N${i}`,
    },
    getValue: async () => {
      // повинна повертати числове значення регістру
      return await entity.devicesManager
        .getDevice("mb110")
        .getRegister(`T${i}`);
    },
  };
  if (i === 0) {
    reg.getValue = async () => {
      return await entity.devicesManager.getDevice("trp08n2").getT();
    };
  }
  logger.addReg(reg);
} // for

console.log("logger=");
console.dir(logger);

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
    ln = entity.ln + `processManager.afterAll()::`;
  if (trace) {
    console.log(ln + `entity.id=${entity.id}`);
    //console.dir(this, { depth: 1, colors: true });
  }
  //let dev = this.devicesManager.getDevice("trp08n1");
  // для того щоб спрацювала лампа "Кінець циклу", потрібно запрограмувати прилад на 1хв. витримки

  //dev.start({ tT: 20, H: 0, Y: 1 });
  return;
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

if (!module.parent) {
  (async () => {
    await dummy(5000);
    let regs = entity.loggerManager.regs;
    while (true) {
      regs["T0"].getValue().then((res) => {
        console.log("T0=", res);
      });
      regs["T1"].getValue().then((res) => {
        console.log("T1=", res);
      });
      regs["T2"].getValue().then((res) => {
        console.log("T2=", res);
      });
      await dummy(4000);
    } // while
  })();
}
