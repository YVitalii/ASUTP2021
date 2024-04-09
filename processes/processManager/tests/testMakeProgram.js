const processManager = require("./testCreateProcessManager");
const log = require("../../../tools/log");
let trace = 1,
  ln = __filename + "::";
let test = () => {
  if (trace) {
    log("i", ln, `processManager=`);
    console.dir(processManager);
  }
  processManager.setProgram();
  if (trace) {
    log("i", ln, `processManager.listSteps=`);
    console.dir(processManager.listSteps);
  }
  if (trace) {
    log("i", ln, `processManager.program=`);
    console.dir(processManager.program, { depth: 4 });
  }
  //processManager.startProgram(1);
};
setTimeout(() => test(), 3000);
