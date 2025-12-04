// cd ./controllers/PID
// supervisor --watch './,../'  --extensions 'js,pug' --timestamp --no-restart-on exit ClassPIDregulator_test_withFurnaceModel.js

const ClassPIDregulator = require("./ClassPIDregulator");
const log = require("../../tools/log");
const dummy = require("../../tools/dummy").dummyPromise;
const Furnace = require("../../devices/furnaceModel/ClassFurnaceModel.js");
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
  kp: 20,
  ki: 0.5,
  kd: 0.0,
  period: 2,
  setPoint: 400,
  period,
  inputRange: { min: 0, max: 1000 },
  outputRange: { min: 10, max: 100 },
  //kiError: 25,
});
pid.start(200);
