let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const Manager = require("../manager.js");
let ln = "testCreateTrp.js::";
let id = 1;

let device1 = new Manager(iface, 1, {
  id: "trp08_1",
  addT: 5,
  emulator: {
    // налаштування емулятора приладу
    minT: 0, // мінімальна температура печі для PID inputRange
    maxT: 1200, // максимальна температура печі для PID inputRange
    pid: undefined, // налаштування емулятора pid-регулятора
    furnace: undefined, // налаштування емулятора печі ClassFurnaceModel.js
  },
});

module.exports = device1;

if (!module.parent) {
  log("i", ln, `device1=`);
  console.dir(device1);
}
