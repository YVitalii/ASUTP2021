const ClassDeviceManagerGeneral = require("../ClassDeviceManagerGeneral");
const iface = require("../../../conf_iface").w2;
const driver = require("../../trp08/driver");
const dummy = require("../../../tools/dummy").dummyPromise;
let trace = 1,
  ln = __filename + "::";
const log = require("../../../tools/log");
let props = {
  id: "trp08",
  iface,
  addr: 1,
  driver,
  header: { ua: `testTRP08`, en: `testTRP08`, ru: `testTRP08` },
};

let devMan = new ClassDeviceManagerGeneral(props);
devMan.addRegister({
  id: "tT",
  header: { ua: `Завдання`, en: `Task`, ru: `Задание` },
  comment: {
    ua: `Цільова температура`,
    en: `Task temperature`,
    ru: `Целевая температура`,
  },
  units: { ua: `°C`, en: `°C`, ru: `°C` },
  type: "number",
  obsolescence: 10,
});

devMan.addRegister({
  id: "T",
  header: { ua: `T`, en: `T`, ru: `T` },
  comment: {
    ua: `Поточна температура`,
    en: `Current temperature`,
    ru: `Текущая температура`,
  },
  units: { ua: `°C`, en: `°C`, ru: `°C` },
  type: "number",
  obsolescence: 5,
});

if (trace) {
  console.log(ln + `devMan.getRegs()=`);
  console.dir(devMan.getRegsValues());
}
if (trace) {
  console.log("i", ln, `devMan.getFullHtml()=`);
  console.dir(devMan.getFullHtml());
}

let test = async () => {
  await devMan.setRegister("tT", 80);
  console.log(ln + "test() finished");
  while (true) {
    await devMan.getRegister("tT");
    await devMan.getRegister("T");
    await dummy(2 * 1000);
  }
};

setInterval(() => {
  log("i", `getRegsValues("tT;T;")=`, devMan.getRegsValues("tT;T;"));
}, 5 * 1000);
test();
