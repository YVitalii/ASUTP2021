/**
 * Знімає трасу ПІД + furnaceModel у logger.txt.
 * Запуск: node ./controllers/PID/tests/PID_createGraph_test.js
 *
 * Кожні period*2 (с симуляції) пише:
 * Time\tTf\tPID.output%\tPID.qp%\tPID.qi%\tPID.qd%
 */
const fs = require("fs");
const path = require("path");
const ClassPIDregulator = require("../ClassPIDregulator.js");
const Furnace = require("../../../devices/furnaceModel/furnaceModel.js");

const PERIOD = 10; // с
const SET_POINT = 250;
const LOG_EVERY_SEC = PERIOD * 2; // 20 с
const SIM_DURATION = 4 * 3600; // 4 год симуляції
const logPath = path.join(__dirname, "logger.txt");

const furnace = new Furnace({
  heatersPow: 120,
  heatersWeight: 15,
  furnaceWeight: 200,
  furnaceMaxT: 1000,
  furnaceMaxLoss: 20,
  period: PERIOD,
});

let lastTf = 20;

const pid = new ClassPIDregulator({
  id: "pid_graph",
  getPV: () => {
    lastTf = furnace.getT();
    return lastTf;
  },
  setOutput: (u) => furnace.heat(u),
  kp: 2.5,
  ki: 0.05,
  kd: 0.3,
  period: PERIOD,
  setPoint: SET_POINT,
  inputRange: { min: 0, max: 1000 },
  outputRange: { min: 0, max: 100 },
  kiError: 80,
});

/** % з кроком 0.1; -0.0 → 0.0 */
function pct(v) {
  let x = Math.round(Number(v) * 10) / 10;
  if (Object.is(x, -0) || x === 0) x = 0;
  return x.toFixed(1);
}

const lines = ["Time\tTf\tPID.output%\tPID.qp%\tPID.qi%\tPID.qd%"];
let lastLogTime = -LOG_EVERY_SEC;

pid.going = 1;
while (furnace.currTime < SIM_DURATION) {
  pid.calculate();
  if (furnace.currTime - lastLogTime >= LOG_EVERY_SEC) {
    lines.push(
      [
        furnace.currTime,
        lastTf.toFixed(2),
        pct(pid.output),
        pct(pid.qp),
        pct(pid.qi),
        pct(pid.qd),
      ].join("\t")
    );
    lastLogTime = furnace.currTime;
  }
}
pid.stop();

fs.writeFileSync(logPath, lines.join("\n") + "\n", "utf8");
console.log(
  `Записано ${lines.length - 1} точок → ${logPath}\n` +
    `останнє: t=${furnace.currTime}s Tf=${lastTf.toFixed(2)}°C ` +
    `out=${pid.output.toFixed(2)} qp=${pid.qp.toFixed(2)} qi=${pid.qi.toFixed(2)} qd=${pid.qd.toFixed(2)}`
);
