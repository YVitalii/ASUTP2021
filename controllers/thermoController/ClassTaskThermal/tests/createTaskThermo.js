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

async function test() {
  let taskThermal = entity.tasksManager.getType("taskThermal");
  let regs = entity.tasksManager.list[1];
  let step = taskThermal.getStep(regs);

  if (trace) {
    log("i", ln, `taskThermal.id=`);
    console.dir(taskThermal.id);
  }
  if (trace) {
    log("i", ln, `regs=`);
    console.dir(regs);
  }
  if (trace) {
    log("i", ln, `step=`);
    console.dir(step);
  }
  await step.start(1);
}

setTimeout(() => {
  test();
}, 3000);
//let taskThermo = new ClassTaskThermal({ maxT: 150, devices: [device] });

// log("i", ln, `entity.tasksManager.program[1]=`);
// let
// console.dir(entity.tasksManager.program[1], { depth: 3 });

// module.exports = entity.tasksManager.getType("taskThermal");
