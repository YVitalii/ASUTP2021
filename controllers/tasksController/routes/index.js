/** tasksControler/routes/
 * Роутер taskControllera
 */

var express = require("express");
var router = express.Router();
const pathResolve = require("path").resolve;
const pug = require("pug");
const fileManagerRouter = require("../../fileManager/routes/");
const dummy = require("../../../tools/dummy.js").dummyPromise;

const log = require("../../../tools/log");
let logName = __dirname + "::",
  trace = 0;
const getFileName = require("../../../tools/reqTools.js").reqGetFileName;
// console.log(logName + `Resolved mainPug= ${mainPug}`);
// if (trace) {
//   log("i", ln, `getFileName=`);
//   console.dir(getFileName);
// }

// трасувальник
router.use(function (req, res, next) {
  let trace = 0,
    ln = `tasksControllerRouter("${req.originalUrl}")::`;
  trace
    ? log("i", `---------- tasksControllerRouter-----------Started!`)
    : null;
  req.tasksManager = req.entity.tasksManager;
  //trace ? log("i", ln, `Started: ${req.tasksManager.ln}`) : null;
  next();
});

router.post("/acceptFile", async function (req, res, next) {
  //res.send(pug.renderFile(mainPug, { body: req.tasksManager.getFullHtml() }));
  //res.render("index", { title: req.tasksManager.ln });
  let trace = 1,
    ln = req.tasksManager.ln + `post(${req.originalUrl})::`;
  let fileName = getFileName(req);
  trace ? console.log("w", ln, `fileName=`, fileName) : null;
  try {
    await req.tasksManager.setCurrentValue(fileName);
    let answer = req.entity.processManager.setProgram();
    log("w", `File "${fileName}" was set as current! `);
    res.send(answer);
    return;
  } catch (error) {
    let msg = error.message;
    err = {
      ua: `Помилка завантаження файлу: '${msg}'`,
      en: `Error file accepting: '${msg}'`,
      ru: `Ошибка применения файла'${msg}'`,
    };
    log("e", ln + err.ua);
    res.status(500).send({ err: err, data: null });
    return;
  }
});

router.use("/fileManager", (req, res, next) => {
  req.fileManager = req.tasksManager.fileManager;
  next();
});

router.use("/fileManager/deleteFile", (req, res, next) => {
  let trace = 1,
    ln = "/fileManager/deleteFile";
  let fileName = getFileName(req);
  trace
    ? log("w", ` ----------  ${ln} Started with fileName=`, fileName)
    : null;
  if (fileName === req.tasksManager.value) {
    let msg = fileName;
    let err = {
      ua: `Неможливо видалити активну програму: '${msg}'`,
      en: `Can't delete active program: '${msg}'`,
      ru: `Невозможно удалить активную программу'${msg}'`,
    };
    log("e", ln + err.ua);
    res.status(400).send({ err: err, data: null });
    return;
  }

  next();
});

// router.use("/fileManager", (req, res, next) => {
//   req.fileManager = req.tasksManager.fileManager;
//   next();
// });

// передаємо керування fileManager
router.use("/fileManager", fileManagerRouter);

/* GET home page. */
router.get("/", async function (req, res, next) {
  let trace = 1,
    ln = req.tasksManager.ln + `router.get((${req.originalUrl})::`;
  trace ? console.log("w", ln, ` ----> GET home page. Started`) : null;
  await dummy(1000);
  res.send(
    pug.renderFile(req.info.mainPug, {
      pageTitle: {
        ua: `${req.entity.fullName.ua} <br> <small>Редагування програм</small>`,
        en: `${req.entity.fullName.en} <br> <small>Program editing.</small>`,
        ru: `${req.entity.fullName.ru}<br> <small>Редактирование программ</small>`,
      },
      body: req.tasksManager.getFullHtml(req),
    })
  );
  //res.render("index", { title: req.tasksManager.ln });
  // res.send(ln);
});

module.exports = router;
// `Сторінка для тестування роботи tasksManager <br> <small>/controllers/tasksController </small>`
