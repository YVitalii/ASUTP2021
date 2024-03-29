const ClassTaskThermal = require("../ClassTaskThermal.js");
const TRP = require("../../../../devices/trp08/manager.js");
const log = require("../../../../tools/log");
let device = {};
device.getT = () => {
  return 1;
};
let trace = 1,
  ln = __dirname + "::";

let taskThermo = new ClassTaskThermal({ maxT: 150, devices: [device] });

if (trace) {
  log("i", ln, `taskThermo.regs=`);

  console.dir(taskThermo.regs, { depth: 3 });
}

module.exports = taskThermo;
