const Class_Task_Thermo = require("../Class_Task_Thermo.js");
const log = require("../../../../tools/log");
let trace = 1,
  ln = __dirname + "::";

let taskThermo = new Class_Task_Thermo();

if (trace) {
  log("i", ln, `taskThermo.regs=`);
  console.dir(taskThermo.regs, { depth: 3 });
}

module.exports = taskThermo;
