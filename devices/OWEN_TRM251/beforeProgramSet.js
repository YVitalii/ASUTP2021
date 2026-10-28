/**
 * Адаптує вміст програми перед записом у TRM-251.
 * [0] — заголовок, лишається без змін.
 * Кожному кроку додає номер програми Pr = 1..3 і номер кроку St = 1..5
 * (5 кроків на програму, не більше 15 кроків) і ставить type з ClassStep_TRM251_Thermal.type.
 * Коли номер програми змінюється, перед першим кроком нової програми
 * вставляє { type: ClassStep_TRM251_nextProgram.type, prgN }.
 * Рядок часу "ГГ:ХХ" у регістрі кроку переводить у хвилини: "01:10" → 70.
 *
 * @param {Array|string} program вміст програми або його JSON
 * @returns {Array}
 */
const ClassStep_TRM251_Thermal = require("./ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_nextProgram = require("./ClassStep_TRM251_nextProgram.js");

const TIME_HHMM = /^(\d+):(\d{1,2})$/;
const STEPS_PER_PROGRAM = 5;
const MAX_PROGRAMS = 3;
const MAX_STEPS = STEPS_PER_PROGRAM * MAX_PROGRAMS;

function toMinutes(value) {
  if (typeof value !== "string") return value;
  const time = TIME_HHMM.exec(value.trim());
  if (!time) return value;
  return parseInt(time[1], 10) * 60 + parseInt(time[2], 10);
}

function adaptStep(step, index) {
  const adapted = {
    Pr: Math.floor(index / STEPS_PER_PROGRAM) + 1,
    St: (index % STEPS_PER_PROGRAM) + 1,
    type: ClassStep_TRM251_Thermal.type,
  };
  for (const key of Object.keys(step)) {
    if (key === "Pr" || key === "St" || key === "type") continue;
    adapted[key] = toMinutes(step[key]);
  }
  return adapted;
}

function beforeProgramSet(program) {
  let list = program;
  if (typeof list === "string") {
    list = JSON.parse(list);
  }
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(
      "beforeProgramSet: програма має бути непорожнім масивом [заголовок, ...кроки]"
    );
  }

  const stepsCount = list.length - 1;
  if (stepsCount > MAX_STEPS) {
    throw new Error(
      `beforeProgramSet: TRM-251 приймає не більше ${MAX_STEPS} кроків (програми 1..${MAX_PROGRAMS}, кроки 1..${STEPS_PER_PROGRAM}), отримано ${stepsCount}`
    );
  }

  const result = [list[0]];
  let previousPr = null;
  for (let i = 1; i < list.length; i++) {
    const step = list[i];
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      throw new Error(`beforeProgramSet: крок ${i} має бути об'єктом`);
    }
    const adapted = adaptStep(step, i - 1);
    if (previousPr !== null && adapted.Pr !== previousPr) {
      result.push({
        type: ClassStep_TRM251_nextProgram.type,
        prgN: adapted.Pr,
      });
    }
    previousPr = adapted.Pr;
    result.push(adapted);
  }
  return result;
}

module.exports = beforeProgramSet;
