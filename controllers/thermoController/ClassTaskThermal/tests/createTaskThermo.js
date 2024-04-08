const entity = require("../../../../tests/testEntity/entity.js");

// const ClassTaskThermal = require("../ClassTaskThermal.js");
// const TRP = require("../../../../devices/trp08/manager.js");
const log = require("../../../../tools/log");
// let device = {};
// device.getT = () => {
//   return 1;
// };
let trace = 1,
  ln = __dirname + "::";

//let taskThermo = new ClassTaskThermal({ maxT: 150, devices: [device] });

if (trace) {
  log("i", ln, `entity.tasksManager.program[1]=`);

  console.dir(entity.tasksManager.program[1], { depth: 3 });
}

module.exports = entity.tasksManager.getType("taskThermal");
