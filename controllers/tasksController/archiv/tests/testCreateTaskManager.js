// const ClassTasksManager = require("../ClassTasksManager");
const log = require("../../../tools/log.js");
// const ClassTaskThermal = require("../../thermoController/ClassTaskThermal/ClassTaskThermal.js");
// const pathResolve = require("path").resolve;
const entity = require("../../../tests/testEntity/entity.js");
// const homeDir = pathResolve("../../tests/testEntity/") + "/"; // посилання на /tests/testEntity
const emulate = true;
let trace = 0,
  ln = __filename + "::";
// let props = {};
// props = {

// };

// let tasksManager = new ClassTasksManager({ editable: true, homeDir });
// let entity = { id: "testCreateTasksManager" };
// let task = new ClassTaskThermal({
//   maxT: 550,
//   emulate,
//   quickHeating: {
//     beforeStart: async function (regs) {
//       console.log(`${entity.id}, quickHeating.beforeStart !`);
//     },
//     heatingPID: async function (regs) {
//       console.log(`${entity.id}, heatingPID.beforeStart !`);
//     },
//     holding: async function (regs) {
//       console.log(`${entity.id}, holding.beforeStart !`);
//     },
//   },
// });

// tasksManager.addType(task);
// console.log(
//   "===================== tasksManager.reg.regs=   ========================="
// );
// console.dir(tasksManager.reg.regs, { depth: 2 });

if (trace) {
  log("i", ln, `entity.tasksManager.reg.regs=`);
  console.dir(entity.tasksManager.reg.regs, { depth: 3 });
}

module.exports = entity.tasksManager;
