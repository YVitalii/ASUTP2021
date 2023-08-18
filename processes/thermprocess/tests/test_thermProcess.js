// supervisor --no-restart-on exit ./processes/thermprocess/tests/test_ThermProcess.js

const ThermStep = require("../ThermStep.js");
const iface = require("../../../rs485/RS485_v200.js");
const ManagerTRP08 = require("../../../devices/trp08/manager.js");
const ThermProcess = require("../ThermProcess.js");
const config = require("../../../config.js");
let program = require("./testProgram.js");
let process = null;

async function start() {
  if (!config.entities[0]) {
    // створюємо прилади
    let devices = [];
    devices.push(new ManagerTRP08(iface, 1, { addT: 5 }));
    // створюємо термічний процес
    process = new ThermProcess(devices);
    // завантажуємо програму
    process.setProgram(program);
    //
    process.start();
    return;
  }

  process = config.entities[0].thermProcess;
  process.setProgram(program);
  process.start();

  // перевірка зупинки програми
  setTimeout(() => {
    //console.log("-------- getProgram ------\n", process.getProgram());
    //console.log("-------- getState ------\n", process.getState());
    process.stop();
  }, 50 * 1000);
} // start()

setTimeout(() => {
  start();
}, 10000);
