const log = require("../../../../tools/log.js");
let trace = 1,
  ln = "testClassHeating()::";
//const step = require("./config.js");
const ClassTask_Heating = require("../ClassTask_Heating.js");

let task = new ClassTask_Heating();

if (trace) {
  log("i", ln, `task=`);
  console.dir(task, { depth: 3 });
}
log(new Date().toLocaleTimeString());
