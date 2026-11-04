/**
 * Адаптує вміст програми перед записом у TRM-251.
 *
 * Вхід — масив або JSON-рядок цього масива, не більше 15 кроків:
 *   [0] заголовок, будь-який об'єкт. Поля не читаються.
 *       Приклад: { type:"description", fName, description, date }.
 *   [1..] крок, об'єкт.
 *       tT — цільова температура, °C.
 *       H, Y — час нагрівання і витримки: хвилини числом або рядок "ГГ:ХХ"
 *       ("01:10", допускається пробіл і одна цифра: " 1:5 ").
 *       Інші поля кроку теж копіюються. Будь-який рядок кроку вигляду "ГГ:ХХ"
 *       стає числом хвилин. Вхідний type кроку не зберігається.
 *
 * Вихід — масив:
 *   [0] той самий об'єкт заголовка, без копіювання і без перетворення часу.
 *   Далі кожен крок:
 *     { Pr, St, type: ClassStep_TRM251_Thermal.type, ...поля кроку }
 *     Pr = floor(i / 5) + 1, St = (i % 5) + 1, i — номер кроку з нуля.
 *     П'ять кроків на програму, програми 1..3. Уже задані Pr і St замінюються.
 *   Коли Pr змінюється, перед першим кроком нової програми вставляється
 *     { type: ClassStep_TRM251_goToPrSt.type, prN, stN }
 *     prN — номер програми, stN — крок, на які переходимо.
 *   Приклад кроку: { tT:100, H:"01:10", Y:"01:15" }
 *     → { Pr:1, St:1, type: ClassStep_TRM251_Thermal.type, tT:100, H:70, Y:75 }.
 *
 * @param {Array|string} program вміст програми або його JSON
 * @returns {Array}
 */
const ClassStep_TRM251_Thermal = require("./ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_goToPrSt = require("./ClassStep_TRM251_goToPrSt.js");

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
        type: ClassStep_TRM251_goToPrSt.type,
        prN: adapted.Pr,
        stN: adapted.St,
      });
    }
    previousPr = adapted.Pr;
    result.push(adapted);
  }
  return result;
}

module.exports = beforeProgramSet;
