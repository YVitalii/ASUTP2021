// cd ./controllers/PID
// supervisor --watch './,../'  --extensions 'js,pug' --timestamp --no-restart-on exit ClassPIDregulator_test_withFurnaceModelTransferFunction.js
// 2025-11-17 furnaceModel_TransferF.js потребує доробки тосу поки що цей тест не працює
const ClassPIDregulator = require("./ClassPIDregulator");
const log = require("../../tools/log");
const dummy = require("../../tools/dummy").dummyPromise;
const Furnace = require("../../devices/furnaceModel/furnaceModel_TransferF");
let period = 1; //s

let furnace = new Furnace({
  initialTemperature: 20,
  ambientTemperature: 20,
  heatCapacity: 4000,
  heatLossCoefficient: 0.45,
  power: 500,
  deltaTime: period,
});

let pid = new ClassPIDregulator({
  id: "pid_NH3",
  getPV: function () {
    return furnace.currentTemperature;
  },
  setOutput: (p) => furnace.setPower(p),
  kp: 0.8,
  ki: 0.8,
  kd: 0.0,
  period: 2,
  setPoint: 100,
  period,
  inputRange: { min: 0, max: 200 },
  outputRange: { min: 10, max: 100 },
  kiError: 50,
});
pid.start(100);
