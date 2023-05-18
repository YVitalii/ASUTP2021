var express = require("express");
var router = express.Router();
// ------------ логгер  --------------------
let log = require("../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log("i", logName) : null;
// ------------- костиль для отримання термічного процессу печі -----
const thermProcess = require("../../../config.js").entities[0].thermProcess;

/** POST - зупинка процессу  */
router.post("/stop", async function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/start => ";
  trace = gTrace !== 0 ? gTrace : trace;

  // --- перевіряємо права користувача на завантаження програми ------
  if (!req.user.permissions.programStop) {
    let user = req.user.username;
    let err = {
      ua: `Поточний користувач ${user} немає права зупиняти програму`,
      en: `Current user ${user} don't have permission for stop program`,
      ru: `Текущий пользователь ${user} не имеет права на остановку программы`,
    };
    log("e", err.ua);
    res.json({ err, data: null });
    return;
  }

  // добуваємо з запиту номер кроку програми
  // let step = 1;
  // --- тут має бути код -------

  // запускаємо програму на виконання
  let prName = thermProcess.getProgram()[0].title;
  try {
    // пробуємо запустити програму на виконання
    // thermProcess.stop(step);
    thermProcess.stop();
    // програма запущена вдало , відсилаємо відповідь
    let response = {
      ua: `Програма ${prName} зупинена`,
      en: `Program  ${prName} was stoped`,
      ru: `Программа ${prName} была остановлена`,
    };
    log("w", ln, response.en);
    res.json({ err: null, data: response });
  } catch (error) {
    // спроба запуску програми завершилась помилкою
    let err = {
      ua: `Помилка зупинки ${prName}: ${error}`,
      en: `Error stopping of  ${prName}: ${error}`,
      ru: `Ошибка остановки ${prName}: ${error}`,
    };
    log("e", ln, err.en);
    res.json({ err, data: null });
  }
  //-----------------------------------------
});

/** POST - запуск процессу  */
router.post("/start", async function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/start => ";
  trace = gTrace !== 0 ? gTrace : trace;

  // --- перевіряємо права користувача на завантаження програми ------
  if (!req.user.permissions.programStart) {
    let user = req.user.username;
    let err = {
      ua: `Поточний користувач ${user} немає права запускати програму`,
      en: `Current user ${user} don't have permission for run program`,
      ru: `Текущий пользователь ${user} не имеет права на запуск программы`,
    };
    log("e", err.ua);
    res.json({ err, data: null });
    return;
  }
  // добуваємо з запиту номер кроку програми

  // let step = 1;
  let step = req.query.stepID;
  // --- тут має бути код -------
  // запускаємо програму на виконання
  let prName = thermProcess.getProgram()[0].title;
  try {
    // пробуємо запустити програму на виконання
    thermProcess.start(step).catch((error) => {
      // спроба запуску програми завершилась помилкою
      let err = {
        ua: `Помилка виконання програми ${prName}: ${error}`,
        en: `Error executing program ${prName}: ${error}`,
        ru: `Ошибка выполнения програмы ${prName}: ${error}`,
      };
      log("e", ln, err.en);
      return;
    });
    // програма запущена вдало , відсилаємо відповідь
    let response = {
      ua: `Програма ${prName} запущена на виконання`,
      en: `Program  ${prName} was run`,
      ru: `Программа ${prName} была запущена`,
    };
    log("w", ln, response.en);
    res.json({ err: null, data: response });
  } catch (error) {
    // спроба запуску програми завершилась помилкою
    let err = {
      ua: `Помилка запуску ${prName}: ${error}`,
      en: `Error run ${prName}: ${error}`,
      ru: `Ошибка запуска ${prName}: ${error}`,
    };
    log("e", ln, err.en);
    res.json({ err, data: null });
  }
  //-----------------------------------------
});

/** POST Отримання поточного стану процесу  */
router.post("/getState", function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/getState => ";

  let state = thermProcess.getState();
  //trace ? console.log(ln, "req=") : null;
  if (trace) {
    log("i", ln, `thermProcess.getState()=`);
    console.dir(state);
  }
  //-----------------------------------------
  res.json({ err: null, data: state });
});

/** POST Отримання поточної програми  */
router.post("/getProgram", function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/getReg => ";
  let program = thermProcess.getProgram();
  //trace ? console.log(ln, "req=") : null;
  if (trace) {
    log("i", ln, `thermProcess.getProgram()=`);
    console.dir(program);
  }
  //-----------------------------------------
  res.json({ err: null, data: program });
});

/** Завантаження поточної програми для виконання */
router.post("/setProgram", function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/setReg => ";

  //trace ? console.log(ln, "req=") : null;
  // ----- завантажуємо програму, вона приходить з браузера  -----
  // --- тестова програма -------
  let incomeProgram = JSON.parse(req.query.newParameters);
  // let incomeProgram = require("../tests/testProgram.js");
  // if (trace) {
  //   log("i", ln, `incomeProgram=`);
  //   console.dir(incomeProgram);
  // }
  // --- перевіряємо права користувача на завантаження програми ------
  trace ? log("i", ln, `req.user.permissions=`, req.user.permissions) : null;
  if (!req.user.permissions.programSet) {
    let user = req.user.username;
    let err = {
      ua: `Поточний користувач ${user} немає права завантажувати програму`,
      en: `Current user ${user} don't have permission for set program`,
      ru: `Текущий пользователь ${user} не имеет права на загрузку програмы`,
    };
    log("e", err.ua);
    res.json({ err, data: null });
    return;
  }
  // ---- завантажуємо програму ----------------------
  thermProcess.setProgram(incomeProgram);
  let prName = thermProcess.getProgram()[0].title;
  trace ? log("w", ln, `prName=`, prName) : null;
  // --- надсилаємо відповідь --------------------
  res.json({
    err: null,
    data: {
      ua: `Програму ${prName} завантажено успішно`,
      en: `Program ${prName} was loaded:`,
      ru: `Программа ${prName} загружена успешно.`,
    },
  });
});

module.exports = router;
