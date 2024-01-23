const ClassTasksManager = require("../ClassTasksManager");
const log = require("../../../tools/log.js");
const ClassTaskThermal = require("../../thermoController/heating/ClassTask_Heating.js");

let trace = 1,
  ln = __filename + "::";
// let props = {};
// props = {

// };

let tasksManager = new ClassTasksManager({ editable: true });

let task = new ClassTaskThermal();

tasksManager.addType(task);

if (trace) {
  log("i", ln, `tasksManager=`);
  console.dir(tasksManager, { depth: 2 });
}

module.exports = tasksManager;
