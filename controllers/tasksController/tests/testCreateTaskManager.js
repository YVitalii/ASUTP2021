const ClassTasksManager = require("../ClassTasksManager");
const log = require("../../../tools/log.js");
const ClassTaskThermal = require("../../thermoController/heating/ClassTask_Heating.js");
const homeDir = __dirname + "";

let trace = 1,
  ln = __filename + "::";
// let props = {};
// props = {

// };

let tasksManager = new ClassTasksManager({ editable: true, homeDir });

let task = new ClassTaskThermal();

tasksManager.addType(task);

if (trace) {
  log("i", ln, `tasksManager.fileManager=`);
  console.dir(tasksManager.fileManager, { depth: 3 });
}

module.exports = tasksManager;
