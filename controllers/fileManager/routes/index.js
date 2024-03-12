//  ---------------- fileManager/routes/index.js ----------------
var express = require("express");
var router = express.Router();
const pathResolve = require("path").resolve;
const pug = require("pug");
const log = require("../../../tools/log");

/* Post getFilesList */
router.post("/getFilesList", function (req, res, next) {
  let trace = 1,
    ln = req.fileManager.ln + 'post("/")::';
  //const mainPug = pathResolve("../../../../views/main.pug");
  let data = req.fileManager.getFilesList();
  console.log(`Resolved data= ${data}`);
  res.send({ err: null, data: data });
  //res.render("index", { title: req.tasksManager.ln });
});

router.post("/deleteFile", async (req, res, next) => {
  let trace = 1,
    ln = req.fileManager.ln + `post(${req.originalUrl})::`;
  let fileName = getFileName(req);
  trace ? console.log("w", ln, `fileName=`, fileName) : null;
  if (req.fileManager.exist(fileName)) {
    try {
      await req.fileManager.deleteFile(fileName);
      let data = {
        ua: `Файл ${fileName} видалено!`,
        en: `File ${fileName} was deleted!`,
        ru: `Файл ${fileName} удален !`,
      };
      log("w", ln + data.en);
      res.send({ err: null, data });
    } catch (error) {
      let msg = ln + error.message;
      err = {
        ua: `Помилка видалення файлу '${msg}'`,
        en: `Error deleting file '${msg}'`,
        ru: `Ошибка удаления файла'${msg}'`,
      };
      log("e", err.ua);
      res.send({ err: err, data: null });
    }
  }

  let err = {
    ua: `Файл з ім'ям ${fileName} не знайдено`,
    en: `File ${fileName} not finded!`,
    ru: `Файл ${fileName} не найден!`,
  };
  log("e", err.ua);
  res.status(404).send({ err: err, data: "Ok" });
});

router.post("/writeFile", async (req, res, next) => {
  let trace = 1,
    ln = req.fileManager.ln + `post(${req.originalUrl})::`;
  let fileName = getFileName(req);
  let text = JSON.stringify(req.body.content);
  trace ? console.log("w", ln, `fileName=`, fileName) : null;
  if (trace) {
    log("i", ln, `req.body=`);
    console.dir(req.body);
  }
  try {
    await req.fileManager.writeFile(fileName, text);
    let data = {
      ua: `Файл ${fileName} збережено!`,
      en: `File ${fileName} was saved!`,
      ru: `Файл ${fileName} сохранен!`,
    };
    log("w", ln + data.en);
    res.send({ err: null, data });
  } catch (error) {
    if (trace) {
      log("i", ln, `error=`);
      console.dir(error);
    }
    let msg = error.message;
    err = {
      ua: `Помилка збереження файлу: '${msg}'`,
      en: `Error file saving: '${msg}'`,
      ru: `Ошибка сохранения файла'${msg}'`,
    };
    log("e", ln + err.ua);
    res.send({ err: err, data: null });
  }
}); //router.post("/writeFile"

router.post("/readFile", async (req, res, next) => {
  let trace = 1,
    ln = req.fileManager.ln + `post(${req.originalUrl})::`;
  let fileName = getFileName(req);
  //trace ? console.log("w", ln, `req=`, req) : null;
  if (trace) {
    console.log(ln + `req.body=`);
    console.dir(req.body);
  }
  if (!req.fileManager.exist(fileName)) {
    let msg = fileName;
    err = {
      ua: `Файл '${msg}' не знайдено!`,
      en: `File '${msg}' not found!`,
      ru: `Файл'${msg}' не найден!`,
    };
    log("e", ln + err.ua);
    res.status(404).send({ err: err, data: null });
    return;
  }
  try {
    let data = await req.fileManager.readFile(fileName);
    log("w", `File ${fileName} was readed! `);

    res.send({ err: null, data: JSON.parse(data) });
  } catch (error) {
    let msg = error.message;
    err = {
      ua: `Помилка читання файлу: '${msg}'`,
      en: `Error file reading: '${msg}'`,
      ru: `Ошибка чтения файла'${msg}'`,
    };
    log("e", ln + err.ua);
    res.status(500).send({ err: err, data: null });
  }
}); //router.post("/writeFile"

module.exports = router;

function getFileName(req) {
  let fileName = req.query.fileName ? req.query.fileName : undefined;
  if (fileName === undefined) {
    fileName = req.body.fileName ? req.body.fileName : undefined;
  }
  return fileName;
}
