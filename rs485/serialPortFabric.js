const { emulateRS485 } = require("../config.js");
const SerialEmulator = require("./serialPortEmulator.js");
const SerialPort = require("serialport");

// Експортуємо функцію, яка повертає потрібний модуль
module.exports = (emulate = undefined) => {
  console.log(`[serialPortFabric.js]:: emulateRS485=${emulateRS485}`);
  emulate = emulate !== undefined ? emulate : emulateRS485;
  return emulate ? SerialEmulator : SerialPort;
};
