let Heating = require("../ClassHeatingStep.js");
let TRP = require("../../../../../devices/trp08/manager.js");
const iface = require("../../../../../conf_iface.js");
const log = require("../../../../../tools/log.js");
let emulate = 0; //1- емулятор; 0 - реальний прилад
const Device = require("../../../../../devices/ClassTemperatureEmulator.js");
let trace = 1,
  ln = "createHeatingStep()::";

props = {
  title: { ua: `Нагрівання.`, en: `Heating.`, ru: `` },
  taskT: 300,
  periodCheckT: 1,
  H: 0.5,
  errH: 0.5,
  errT: { min: undefined, max: 100 },
};

let dev;

if (emulate) {
  dev = new Device({ heating: { tT: props.taskT, time: props.H * 60 } });
} else {
  dev = new TRP(iface, 1);
}

props.getT = async () => {
  return await dev.getT();
};
let step = new Heating(props);

(async () => {
  log("w", "----------- нормальне завершення процесу ----------");

  setTimeout(async () => {
    await dev.start();
    await step.start();
  }, 1000);

  // log("w", "----------- завершення процесу по перевищенню часу  ----------");
  // dev.heating.tT = props.taskT;
  // dev.heating.time = (props.H + props.errH) * 60 * 2 + 10;
  // await dev.start();
  // await step.start();
  // log("i", "CreateHeatingStep()::Finished!");
})();

if (trace) {
  log("i", ln, `step=`);
  console.dir(step);
}
