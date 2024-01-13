const ClassTasksManager = require("../ClassTasksManager");
const log = require("../../../tools/log.js");
const ClassTasksThermal = require("../../thermoController/ClassTaskThermal/ClassTaskThermal");

let trace = 1,
  ln = __filename + "::";
let props = {};
props = {
  id: "thermalStep",
  type: "thermal",
  comment: { ua: `Термообробка`, en: `Thermal`, ru: `Термообработка` },
  value: 0,
};

let tasksManager = new ClassTasksManager();

let task = new ClassTasksThermal(props);

tasksManager.addType(task);
if (trace) {
  log("i", ln, `tasksManager=`);
  console.dir(tasksManager, { depth: 2 });
}

module.exports = tasksManager;
