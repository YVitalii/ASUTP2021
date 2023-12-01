let Device = require("../../../../../devices/ClassTemperatureEmulator.js");
let ThermProcess = require("../ClassThermProcessStep.js");
let log = require("../../../../../tools/log.js");
let trace = 1,
  ln = module.filename + "::";
let props = {
  title: {
    ua: `Тестування термічного кроку`,
    en: `Testing thermprocess step`,
    ru: `Тестирование шага термообработки`,
  },
  tT: 350,
  H: 0.5,
  Y: 0.2,
  errH: 60,
  errT: { min: -25, max: +25 },
  wT: 10,
  wH: 0.1,
  regMode: "pid",
  pid: { o: 10, td: 0, ti: 0 },
};

let devices = {
  furnaceTRP: new Device({ heating: { tT: 750, time: 60 } }),
  retortTRP: new Device({
    heating: { tT: props.taskT, time: props.H * 60 * 0.9 },
  }),
};

props.devices = devices;
props.getT = async () => {
  return await devices.retortTRP.getT();
};

let step = new ThermProcess(props);
trace ? log("i", ln, `------`, step, "--------") : null;
if (trace) {
  log("", ln, `step=`);
  console.dir(step);
}
module.exports = step;

// step.start();
