/**
 * 2025-11-10
 * Модуль створює і повертає новий драйвер заснований на класі
 * та переносить опис регістрів із застарівшого драйвера в новий.
 * Методи застарівшого драйвера не використовуються і замінюються новими
 * (з класу ClassDriverGeneral )
 */

const oldDriver = require("./driverOld");
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

/**
 * Костиль для старого manager.js
 * Повертає опис регістра у вигляді об'єкта: {name:імя регістра як в драйвері, description: this.title, units: this.units}
 * @param {String} [regName]  - опис регістра
 * @returns {Object}
 */
newDriver.getRegDescription = function (regName = null) {
  if (regName == null || !this.regs.has(regName)) {
    return null;
  }
  let res = this.regs.get(regName);
  return {
    name: regName,
    header: res.header ? res.header : undefined,
    states: res.states ? res.states : undefined,
    description: res.title,
    units: res.units,
    type: res.type,
  };
};

if (trace) {
  console.log(gLn + `newDriver=`);
  console.dir(newDriver, { depth: 3 });
}

module.exports = newDriver;
