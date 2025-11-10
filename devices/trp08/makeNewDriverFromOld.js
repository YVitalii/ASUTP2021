/**
 * 2025-11-10
 * Модуль створює і повертає новий драйвер заснований на класі
 * та переносить опис регістрів із застарівшого драйвера в новий.
 * Методи застарівшого драйвера не використовуються і замінюються новими
 * (з класу ClassDriverGeneral )
 */

const oldDriver = require("./driver");
const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const newDriver = new ClassDriverGeneral({
  id: "trp08driver",
});
let trace = 0,
  gLn = `makeNewDriverFromOld()::`;
if (trace) {
  console.log(gLn + `oldDriver=`);
  console.dir(oldDriver);
}

oldDriver.regs.forEach((value, key, map) => {
  value.id = key;
  value.ln = oldDriver.id + "::" + value.id;
  newDriver.addRegister(value);
});

if (trace) {
  console.log(gLn + `newDriver=`);
  console.dir(newDriver, { depth: 3 });
}

module.exports = newDriver;
