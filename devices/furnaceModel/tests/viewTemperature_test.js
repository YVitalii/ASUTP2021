/**
 * Ручний перегляд температури моделі печі.
 * Запуск: node ./devices/furnaceModel/tests/viewTemperature_test.js
 */
const Furnace = require("../furnaceModel.js");

const furnace = new Furnace({
  heatersPow: 85,
  heatersWeight: 55,
  furnaceWeight: 100,
  furnaceMaxT: 400,
  furnaceMaxLoss: 25,
  period: 5,
});

function printSample(label, step, t) {
  console.log(`${label} step=${step} t=${furnace.currTime}s T=${t.toFixed(2)}°C`);
}
let k=5
console.log(`--- 1. power=0, ${k} опитувань ---`);
furnace.heat(0);
for (let i = 1; i <= 5; i++) {
  printSample("idle", i, furnace.getT());
}

console.log("--- 2. power=50% ---");
furnace.heat(50);
k=300;
console.log(`--- 3. getT() × ${k}, друк кожен 5-й ---`);
for (let i = 1; i <= 200; i++) {
  const t = furnace.getT();
  if (i % 5 === 0) printSample("heat50", i, t);
}

console.log("--- 4. power=0 ---");
furnace.heat(0);
k=100;
console.log(`--- 5. getT() × ${k}, друк кожен 5-й ---`);
for (let i = 1; i <= 100; i++) {
  const t = furnace.getT();
  if (i % 5 === 0) printSample("cool", i, t);
}
