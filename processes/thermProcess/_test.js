const ThermStep = require("../../processes/ThermProcess/thermStep.js");
// настройки шага
let task = {
  taskT: 1120,
  heatTime: 4 * 60,
  holdTime: 60,
  timeErr: 30,
};

let thermProcess = new ThermStep(task);
//thermProcess.addStep({ holdTime: 50 });
