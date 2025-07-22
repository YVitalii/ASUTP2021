const ClassPIDregulator = require("./ClassPIDregulator");
const log = require("../../tools/log");
const dummy = require("../../tools/dummy").dummyPromise;
const Furnace = require("../../devices/furnaceModel/furnaceModel_TransferF");
let period = 2; //s

let furnace = new Furnace({
  initialTemperature: 20,
  ambientTemperature: 20,
  heatCapacity: 1000,
  heatLossCoefficient: 0.45,
  power: 7000,
  deltaTime: period,
});

let pid = new ClassPIDregulator({
  id: "pid_NH3",
  getPV: function () {
    return furnace.currentTemperature;
  },
  setOutput: (p) => furnace.setHeatingPower(p),
  kp: 0.9,
  ki: 0.02,
  kd: 0.01,
  period: 2,
  setPoint: 100,
  period,
  inputRange: { min: 0, max: 200 },
  outputRange: { min: 10, max: 100 },
  kiError: 25,
});
pid.start(100);
