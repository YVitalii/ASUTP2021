const ThermStep = require("../ThermStep.js");
const iface = require("../../../rs485/RS485_v200.js");
const ManagerTRP08 = require("../../../devices/trp08/manager.js");
const ThermProcess = require("../ThermProcess.js");

let program = require("./testProgram.js");

async function start() {
  // створюємо прилади
  let devices = [];
  devices.push(new ManagerTRP08(iface, 1, { addT: 5 }));
  // створюємо термічний процес
  let process = new ThermProcess(devices);
  // завантажуємо програму
  process.setProgram(program);
  //
  process.start();

  // перевірка зупинки програми
  setTimeout(() => {
    console.log("-------- getProgram ------\n", process.getProgram());
    console.log("-------- getState ------\n", process.getState());
    //process.stop();
  }, 20000);
}

setTimeout(() => {
  start();
}, 10000);
