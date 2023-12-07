const regsRender = require("../regsRender");
const log = require("../../../tools/log");
const pug = require("pug");
const writeFile = require("fs").writeFileSync;

let gln = "test::";

let regs = {};

regs.regMode = {
  id: "regMode",
  header: "regMode",
  type: "select",
  value: ["pid"], // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
  title: {
    ua: `Закон регулювання`,
    en: `Control type`,
    ru: `Закон регулирования`,
  },
};

regs.H = {
  id: "H",
  type: "time",
  header: "H",
  value: "00:00",
  title: {
    ua: `Тривалість нагрівання, хв`,
    en: `Heating delay, min`,
    ru: `Длительность нагревания, мин`,
  },
  min: "00:00",
  max: "99:59",
};

// максимальний час запізнення нагрівання, після якого рахується помилка
regs.errH = {
  id: "errH",
  header: "errH",
  type: "number",
  value: 0,
  title: {
    ua: `Помилка тривалості нагрівання (0=вимкнути), хв`,
    en: `Error of heating duration (0=disable), minute`,
    ru: `Ошибка длительности времени нагревания (0=отключить), мин`,
  },
  min: 0,
  max: 120,
};

// температура першої хвилі перерегулювання, слугує для прийняття рішення про пропуск/очікування етапу першої хвилі
regs.wT = {
  id: "wT",
  header: "wT",
  type: "number",
  value: 0,
  title: {
    ua: `Перерегулювання першої хвилі (0=вимкнути), °С`,
    en: `Overheating for first wave (0=disable), °С`,
    ru: `Перерегулирование первой волны (0=отключить), °С`,
  },
  min: 0,
  max: 200,
};

log("w", "============================================================");
let html = regsRender(regs, { prefix: "st1_", lang: "ua" });
let fileName = __dirname + "\\index.html";
let main = __dirname.slice(0, -16) + "main.pug";
log("w", "main=", main);
html = pug.renderFile(main, {
  body: html,
  pageTitle: "test regsRender",
});
writeFile(fileName, html);
log("w", "Файл записано:", fileName);
