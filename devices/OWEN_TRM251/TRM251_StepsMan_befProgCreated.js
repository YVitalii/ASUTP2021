/**
 * Адаптує вміст програми перед записом у TRM-251.
 *
 * Вхід — масив або JSON-рядок цього масива, не більше 11 кроків:
 *   [0] заголовок, будь-який об'єкт. Поля не читаються.
 *       Приклад: { type:"description", fName, description, date }.
 *   [1..] крок, об'єкт.
 *       tT — цільова температура, °C.
 *       H, Y — час нагрівання і витримки: хвилини числом або рядок "ГГ:ХХ"
 *       ("01:10", допускається пробіл і одна цифра: " 1:5 ").
 *       Інші поля кроку теж копіюються. Будь-який рядок кроку вигляду "ГГ:ХХ"
 *       стає числом хвилин. Вхідний type кроку не зберігається.
 *
 * У приладі 5 кроків на програму. Після виконання кроку 5 він переходить
 * у «Програму виконано» і перестає відповідати по RS485. Тому програми 1 і 2
 * мають 4 робочі кроки, а крок 5 — фальш-крок: ті самі tT, H, Y, що в кроці 4,
 * тип goToPrSt, prN наступної програми і stN 1. Він пишеться в прилад, щоб
 * слот 5 не був нульовим, і в процесі одразу переходить далі, не чекаючи кінця.
 * Програма 3 приймає не більше 3 кроків. Разом не більше 4+4+3 = 11:
 * довший запис не вміщується в кадр, на який прилад відповідає.
 *
 * Вихід — масив:
 *   [0] той самий об'єкт заголовка плюс maxStepsCount. Час у ньому не чіпається.
 *   [1] { type: TRM251_ProgLoadToDev, program } — program це розібрана програма
 *       [заголовок, ...кроки], без кроків запису, пуску і стопу.
 *   [2] { type: TRM251_Start, prN: 1, stN: 1 }.
 *   Далі кроки:
 *     { Pr, St, type: ClassStep_TRM251_Thermal.type, ...поля кроку }
 *     Програми 1 і 2: St 1..4. Програма 3: St 1..3.
 *     Уже задані Pr і St замінюються.
 *     Після 4-го кроку програми 1 або 2, якщо далі є ще кроки:
 *     { Pr, St:5, type: goToPrSt, tT, H, Y, prN, stN:1 }.
 *   Останній елемент — { type: TRM251_Stop }.
 *   Приклад кроку: { tT:100, H:"01:10", Y:"01:15" }
 *     → { Pr:1, St:1, type: ClassStep_TRM251_Thermal.type, tT:100, H:70, Y:75 }.
 *
 * @param {Array|string} program вміст програми або його JSON
 * @returns {Array}
 */
const ClassStep_TRM251_Thermal = require("./ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_goToPrSt = require("./ClassStep_TRM251_goToPrSt.js");
const ClassStep_TRM251_ProgLoadToDev = require("./ClassStep_TRM251_ProgLoadToDev.js");
const ClassStep_TRM251_Start = require("./ClassStep_TRM251_Start.js");
const ClassStep_TRM251_Stop = require("./ClassStep_TRM251_Stop.js");

const TIME_HHMM = /^(\d+):(\d{1,2})$/;
const STEPS_PER_PROGRAM = 4;
const MAX_PROGRAMS = 3;
const DEVICE_STEP_COUNT = 5;
const PROGRAM3_MAX_STEPS = 3;
const MAX_STEPS = STEPS_PER_PROGRAM * (MAX_PROGRAMS - 1) + PROGRAM3_MAX_STEPS;

function toMinutes(value) {
  if (typeof value !== "string") return value;
  const time = TIME_HHMM.exec(value.trim());
  if (!time) return value;
  return parseInt(time[1], 10) * 60 + parseInt(time[2], 10);
}

/** Індекс кроку з нуля → програма і крок приладу. Програма 3 вміщує 5-й крок. */
function placeStep(index) {
  const firstPrograms = STEPS_PER_PROGRAM * (MAX_PROGRAMS - 1);
  if (index < firstPrograms) {
    return {
      Pr: Math.floor(index / STEPS_PER_PROGRAM) + 1,
      St: (index % STEPS_PER_PROGRAM) + 1,
    };
  }
  return { Pr: MAX_PROGRAMS, St: index - firstPrograms + 1 };
}

function adaptStep(step, index) {
  const place = placeStep(index);
  const adapted = {
    Pr: place.Pr,
    St: place.St,
    type: ClassStep_TRM251_Thermal.type,
  };
  for (const key of Object.keys(step)) {
    if (key === "Pr" || key === "St" || key === "type") continue;
    adapted[key] = toMinutes(step[key]);
  }
  return adapted;
}

/** Крок 5 програм 1 і 2: ті самі tT, H, Y і перехід на наступну програму. */
function fakeStep(previous) {
  return {
    Pr: previous.Pr,
    St: DEVICE_STEP_COUNT,
    type: ClassStep_TRM251_goToPrSt.type,
    tT: previous.tT,
    H: previous.H,
    Y: previous.Y,
    prN: previous.Pr + 1,
    stN: 1,
  };
}

function beforeProgramSet(program) {
  let list = program;
  if (typeof list === "string") {
    list = JSON.parse(list);
  }
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(
      "beforeProgramSet: програма має бути непорожнім масивом [заголовок, ...кроки]",
    );
  }

  const stepsCount = list.length - 1;
  if (stepsCount > MAX_STEPS) {
    throw new Error(
      `beforeProgramSet: TRM-251 приймає не більше ${MAX_STEPS} кроків (програми 1 і 2 по ${STEPS_PER_PROGRAM}, програма ${MAX_PROGRAMS} до ${PROGRAM3_MAX_STEPS}), отримано ${stepsCount}`,
    );
  }

  list[0].maxStepsCount = MAX_STEPS;
  const parsed = [list[0]];
  for (let i = 1; i < list.length; i++) {
    const step = list[i];
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      throw new Error(`beforeProgramSet: крок ${i} має бути об'єктом`);
    }
    const adapted = adaptStep(step, i - 1);
    parsed.push(adapted);
    const continues =
      i < list.length - 1 &&
      adapted.St === STEPS_PER_PROGRAM &&
      adapted.Pr < MAX_PROGRAMS;
    if (continues) parsed.push(fakeStep(adapted));
  }
  return [
    list[0],
    {
      type: ClassStep_TRM251_ProgLoadToDev.type,
      program: parsed,
    },
    {
      type: ClassStep_TRM251_Start.type,
      prN: 1,
      stN: 1,
    },
    ...parsed.slice(1),
    { type: ClassStep_TRM251_Stop.type },
  ];
}

module.exports = beforeProgramSet;
