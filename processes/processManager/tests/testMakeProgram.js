const processManager = require("./testCreateProcessManager");
const log = require("../../../tools/log");
const dummy = require("../../../tools/dummy").dummyPromise;
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
//setTimeout(() => test(), 3000);

startStopLog = async () => {
  await processManager.start();
  log("e", ln, "----------- Started");
  await dummy(30 * 1000);
  processManager.stop();
  log("e", ln, "----------- Stoped");
  await dummy(90 * 1000);
  log("e", ln, "----------- Resume started");
  await processManager.start(2);
  log("e", ln, "Resumed");
};

setTimeout(() => startStopLog(), 15 * 1000);
