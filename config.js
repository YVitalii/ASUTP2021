const config = {};

// включает/выключает  эмуляцию обмена по RS485
config.emulateRS485 = 0; //емуляція rs485;

config.test = true; // режим розробки

// трасувальник
let trace = 0;
let title = "config.js::"; // загальний підпис
let ln = title;

module.exports = config;
trace ? log("i", ln, `---------- Config.js loaded! --------------`) : null;

if (!module.parent) {
  console.dir(config, { depth: 4 });
}
