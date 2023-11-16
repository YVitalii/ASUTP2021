let Heating = require("../ClassStepHeating.js");
let TRP = require("../../../../../devices/trp08/manager.js");
const iface = require("../../../../../conf_iface.js");
const log = require("../../../../../tools/log");
let trace = 1,
  ln = "createHeatingStep()::";
let dev = new TRP(iface, 1);
props = {
  title: { ua: `Нагрівання. Піч`, en: `Heating. Furnace`, ru: `` },
  taskT: 700,
  time: 60,
  dTime: -20,
  limitT: { min: -100, max: 100 },
  getT: async () => {
    return await dev.getT();
  },
  deviceSetParams: async () => {
    let params = { tT: this.taskT, H: 60, Y: 120, o: 10, ti: 0, td: 0 };
    return await dev.setParams(params);
  },
  deviceStart: async () => {
    return await dev.start();
  },
  deviceStop: async () => {
    return await dev.stop();
  },
};

let step = new Heating(props);

if (trace) {
  log("i", ln, `step=`);
  console.dir(step);
}
