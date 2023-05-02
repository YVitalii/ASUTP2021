const ThermStep = require("../ThermStep.js");
const iface = require("../../../rs485/RS485_v200.js");

const ManagerTRP08 = require("../../../devices/trp08/Manager.js");

let device = new ManagerTRP08(iface, 1, { addT: 5 });
let step = {
  startT: 0,
  tT: 30,
  dTmin: -5,
  dTmax: 5,
  time: 2,
  errTime: 1,
  reg: 1,
  o: 35,
  di: 10,
  dt: 150,
};

async function start() {
  let task = new ThermStep(device, step);
  // зупиняємо програму
  setTimeout(() => {
    console.dir(task);
    task.stop();
  }, 20000);

  await task.go().catch((err) => {
    console.error(err);
  });

  step.startT = step.tT;
  task = new ThermStep(device, step);
  // зупиняємо програму
  setTimeout(() => {
    console.dir(task);
    task.stop();
  }, 20000);

  await task.go().catch((err) => {
    console.error(err);
  });
  // зупиняємо програму
  setTimeout(() => {
    task.stop();
  }, 30000);
}

setTimeout(() => {
  start();
}, 10000);
