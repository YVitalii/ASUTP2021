let Device = require("../../../../../devices/ClassTemperatureEmulator.js");
let ThermProcess = require("../ClassThermStep.js");
let props = {
  title: { ua: `Тестування термічного кроку`, en: ``, ru: `` },
  taskT: 350,
  H: 0.5,
  Y: 0.2,
  errH: 60,
  errT: { min: -25, max: +25 },
  waitT: 10,
  waitH: 0.1,
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

step.start();

setTimeout(() => {
  //log(";;;;;; Stop");
  step.stop();
}, 12000);
