const ThermStep = require("../ThermStep.js");
const iface = require("../../../rs485/RS485_v200.js");

const ManagerTRP08 = require("../../../devices/trp08/Manager.js");

let device = new ManagerTRP08(iface, 1, { addT: 5 });
let step = {
  reg: 1,
  tT: 30,
  dTmin: -5,
  dTmax: +5,
  H: 0,
  errH: 1,
  Y: 30,
  errY: 30,
  o: 35,
  di: 0,
  dt: 0,
};

async function start() {
  const task = new ThermStep(device, step);
  await task.go();
}

setTimeout(() => {
  start();
}, 10000);
