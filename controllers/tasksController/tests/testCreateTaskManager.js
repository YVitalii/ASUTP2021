const ClassTasksManager = require("../ClassTasksManager");
const log = require("../../../tools/log.js");
const ClassTasksThermal = require("../../thermoController/ClassTaskThermal/ClassTaskThermal");

let trace = 1,
  ln = __filename + "::";
let props = {};
props = {
  id: "thermal",
  type: "thermal",
  title: { ua: `Термообробка`, en: `Thermal`, ru: `Термообработка` },
};

let tasksManager = new ClassTasksManager(props);

let task = new ClassTasksThermal();

tasksManager.addType(task);
if (trace) {
  log("i", ln, `tasksManager=`);
  console.dir(tasksManager.types, { depth: 3 });
}

module.exports = tasksManager;
