// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
const lN = "programTransform.js::";

let synonims = {
  tT: "T",
  ti: "i",
  td: "d",
  reg: "r",
};
// список параметрів, що потрібні для програми
let fields = [
  "tT",
  "H",
  "Y",
  "reg",
  "o",
  "ti",
  "td",
  "u",
  "dTmin",
  "dTmax",
  "errTime",
];

function parseStep(obj) {
  let parsed = {};
  let trace = 1;
  let ln = lN + "parseStep()::";
  trace ? log("i", ln, obj) : null;
  for (let i = 0; i < fields.length; i++) {
    let trace = 0;
    const el = fields[i];
    if (obj[el] || obj[el] === 0) {
      parsed[el] = obj[el];
      continue;
    }

    let syn = synonims[el];
    trace ? log("i", ln, "Not found:[", el, "], try find: [", syn, "]") : null;

    if (syn && (obj[syn] || obj[syn] === 0)) {
      parsed[el] = obj[syn];
    }
  }
  trace ? log("i", ln, "Parsed:", parsed) : null;
  // формуємо завдання для процессу
  return parsed;
}
function generateFirstEmptyStep(note) {
  let res = {};
  for (let i = 0; i < fields.length; i++) {
    res[fields[i]] = 0;
  }
  res.note = note;
  res.startTime = new Date();
  return res;
}
/**Отримує масив кроків програми з браузера, та перетворює їх в потрібний надалі формат
 * @param {Array of Objects} arr - масив кроків програми
 * @param {Object} arr[0] - загальний опис {id, title, description, date}
 * @param {Object} arr[1..] - опис кроку {T,H,Y,o,i,d,u,r}
 * @returns {Array of Objects} - [{id, title, description, date},нульовийКрок, Крок1:1, Крок1:2, Крок2:1.. ]
 *
 */

function generateProgram(arr) {
  let program = [];
  // тут маємо запушити опис програми
  let descr = { ...arr[0] };
  descr.startTime;
  program.push(descr);

  //program.push(generateFirstEmptyStep("Очікування"));
  for (let i = 1; i < arr.length; i++) {
    const parsed = parseStep(arr[i]);
    let step = {};
    // загальна для всіх кроків інформація
    step.reg = parsed.reg ? parsed.reg : 0;
    step.o = parsed.o ? parsed.o : 0;
    step.ti = parsed.ti ? parsed.ti : 0;
    step.td = parsed.td ? parsed.td : 0;
    step.u = parsed.u ? parsed.u : 0;
    step.startTime = null;
    step.finishTime = null;
    step.dTmin = parsed.dTmin ? parsed.dTmin : -5;
    step.dTmax = parsed.dTmax ? parsed.dTmax : +5;
    // для зручності розбиваємо кожний крок на підкроки: нагрівання + витримка
    // ---------- перший під-крок - Нагрівання

    step.startT = i == 1 ? 0 : program[(i - 1) * 2].tT; // попередній крок
    step.tT = parsed.tT ? parsed.tT : 0;

    step.time = parsed.H ? parsed.H : 0;
    step.errTime = parsed.errTime ? parsed.errTime : 60;
    step.note = `Крок ${i}:1.Нагрівання ${step.startT}->${
      parsed.tT
    }\u00b0C; H=${parsed.H ? parsed.H : "\u221E"}хв`;

    program.push({ ...step }); //записуємо клонований крок
    // ------------ другий під-крок - Витримка
    step.note = `Крок ${i}:2. Витримка T=${parsed.tT}\u00b0C; Y=${
      parsed.Y ? parsed.Y : "\u221E"
    }хв`;
    step.startT = step.tT;
    step.time = parsed.Y ? parsed.Y : 0;
    step.errTime = 0;
    program.push({ ...step }); //записуємо клонований крок
  }
  return program;
}

module.exports = generateProgram;

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let arr = require("./tests/testProgram.js");
  console.dir(generateProgram(arr));
}
