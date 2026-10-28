/**
 * Сира програма до beforeProgramSet: заголовок і кроки thermalTaskSimple.
 * Час ще рядками "ГГ:ХХ", номерів Pr/St і маркерів переходу немає.
 */
module.exports = [
  {
    id: "description",
    type: "description",
    fName: "prg02",
    description: "Колеса чавунні. Відпуск.",
    date: "2026-10-23T11:54:11.075Z",
  },
  {
    type: "thermalTaskSimple",
    tT: 110,
    H: 10,
    Y: 20,
  },
  {
    type: "thermalTaskSimple",
    tT: 330,
    H: 50,
    Y: 70,
  },
  {
    type: "thermalTaskSimple",
    tT: 450,
    H: "00:59",
    Y: "02:00",
  },
  {
    type: "thermalTaskSimple",
    tT: 550,
    H: 30,
    Y: 40,
  },
  {
    type: "thermalTaskSimple",
    tT: 600,
    H: 20,
    Y: 30,
  },
  {
    type: "thermalTaskSimple",
    tT: 200,
    H: 15,
    Y: 25,
  },
  {
    type: "thermalTaskSimple",
    tT: 400,
    H: "01:00",
    Y: "01:30",
  },
  {
    type: "thermalTaskSimple",
    tT: 500,
    H: 40,
    Y: 60,
  },
  {
    type: "thermalTaskSimple",
    tT: 250,
    H: 10,
    Y: 15,
  },
];
