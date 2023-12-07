let Heating = require("../ClassHeatingStep.js");
//let TRP = require("../../../../../devices/trp08/manager.js");
//const iface = require("../../../../../conf_iface.js");
const log = require("../../../../../tools/log.js");
let emulate = 1; //1- емулятор; 0 - реальний прилад
const Device = require("../../../../../devices/ClassTemperatureEmulator.js");
let trace = 1,
  ln = "createHeatingStep()::";

props = {
  title: { ua: `Нагрівання`, en: `Heating`, ru: `Нагрев` },
  tT: 300,
  periodCheckT: 1,
  H: 50,
  errH: 0.5,
  errTmin: 0,
  errTmax: 100,
  wave: {
    period: 1,
  },
};

let dev;

if (emulate) {
  dev = new Device({ heating: { tT: props.tT, time: props.H * 60 } });
} else {
  dev = new TRP(iface, 1);
}

props.getT = async () => {
  let t = await dev.getT();
  log(ln, "getT()::t=", t);
  return t;
};

let step = new Heating(props);
step.dev = dev;
module.exports = step;

// log("i", ln, `step=`);
// console.dir(step);

if (!module.parent) {
}
