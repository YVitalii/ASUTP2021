var express = require("express");
var router = express.Router();
const pathResolve = require("path").resolve;
const pug = require("pug");
const fileManagerRouter = require("../../fileManager/routes/");
const mainPug = pathResolve("../../../../views/main.pug");
console.log(`Resolved mainPug= ${mainPug}`);
const log = require("../../../tools/log");
let ln = __dirname + "::",
  trace = 1;
const getFileName = require("../../../tools/reqTools.js").reqGetFileName;

if (trace) {
  log("i", ln, `getFileName=`);
  console.dir(getFileName);
}

router.post("/acceptFile", async function (req, res, next) {
  //res.send(pug.renderFile(mainPug, { body: req.tasksManager.getFullHtml() }));
  //res.render("index", { title: req.tasksManager.ln });
  let trace = 1,
    ln = req.tasksManager.ln + `post(${req.originalUrl})::`;
  let fileName = getFileName(req);
  trace ? console.log("w", ln, `fileName=`, fileName) : null;
  try {
    await req.tasksManager.setCurrentValue(fileName);
    log("w", `File "${fileName}" was set as current! `);
    let data = {
      ua: `Программа успішно завантажена!`,
      en: `Program succesfully accepted!`,
      ru: `РускійВаєннійКарабльІдіНаХ!`,
    };
    res.send({ err: null, data: JSON.stringify(data) });
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
  let fileName = getFileName(req);
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

router.use("/fileManager", (req, res, next) => {
  req.fileManager = req.tasksManager.fileManager;
  next();
});

router.use("/fileManager", fileManagerRouter);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send(pug.renderFile(mainPug, { body: req.tasksManager.getFullHtml() }));
  //res.render("index", { title: req.tasksManager.ln });
});

module.exports = router;
