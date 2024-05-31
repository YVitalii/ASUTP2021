const ClassDeviceRegGeneral = require("../ClassDeviceRegGeneral");

let reg = new ClassDeviceRegGeneral({
  id: "tT",
  header: { ua: `Завдання`, en: `Task`, ru: `Задание` },
  comment: {
    ua: `Цільова температура`,
    en: `Task temperature`,
    ru: `Целевая температура`,
  },
  units: { ua: `°C`, en: `°C`, ru: `°C` },
  type: "number",
  obsolescence: 20,
});
console.log("---- after  new ----------");
console.dir(reg);

reg.value = 15;
console.log("---- after  change value ----------");
console.dir(reg);

console.log("---- getAll() ----------");
console.dir(reg.getAll());
