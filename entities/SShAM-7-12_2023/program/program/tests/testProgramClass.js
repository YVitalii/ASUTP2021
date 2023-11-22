const log = require("../../../../../tools/log.js");
let emulate = 1; //1- емулятор; 0 - реальний прилад
const Device = require("../../../../../devices/ClassTemperatureEmulator.js");
const Program = require("../../program/ClassProgram.js");
let trace = 1,
  ln = "testProgramClass.js::";
let task = {
  tT: 100,
  heating: 0,
  holding: 0.5,
  Kn: 0,
  Kc: 0,
};

const entity = {
  maxT: 750,
  devices: {
    furnaceTRP: new Device({ heating: { tT: 700, time: 30 } }),
    retortTRP: new Device({ heating: { tT: task.tT, time: 45 } }),
  },
  program: new Program(),
};

if (trace) {
  log("i", ln, `entity=`);
  console.dir(entity);
}

(async () => {
  entity.program.setProgram(task, entity);
  //   await entity.program.steps[1].start();
  await entity.program.start();

  log("i", ln, "program finished");
})();
