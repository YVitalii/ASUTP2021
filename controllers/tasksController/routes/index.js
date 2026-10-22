/**
 * Роутер менеджера програм.
 * Контракт: controllers/tasksController/ClassTasksManager_AI_notes.TXT
 */
const express = require("express");
const router = express.Router();
const pug = require("pug");
const log = require("../../../tools/log");
const getFileName = require("../../../tools/reqTools.js").reqGetFileName;

function localizedError(msg) {
  return {
    ua: `Помилка: '${msg}'`,
    en: `Error: '${msg}'`,
    ru: `Ошибка: '${msg}'`,
  };
}

function sendErr(res, ln, error) {
  let err =
    error && error.msg
      ? error.msg
      : localizedError(error && error.message ? error.message : String(error));
  log("e", ln + err.ua);
  res.send({ err, data: null });
}

router.use(function (req, res, next) {
  req.tasksManager = req.entity && req.entity.tasksManager;
  if (!req.tasksManager) {
    res.send({
      err: localizedError("Tasks manager is not defined"),
      data: null,
    });
    return;
  }
  next();
});

function renderTasksPage(req, res) {
  let html = pug.renderFile(req.info.mainPug, {
    lang: req.user && req.user.lang ? req.user.lang : "ua",
    pageTitle: {
      ua: "Редагування програми",
      en: "Program editing",
      ru: "Редактирование программы",
    },
    body: req.tasksManager.getFullHtml(),
  });
  res.send(html);
}

router.get(/^\/?$/, renderTasksPage);

router.post("/getFilesList", function (req, res) {
  let ln = req.tasksManager.ln + "post(/getFilesList)::";
  try {
    res.send({ err: null, data: req.tasksManager.getTasksList() });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

router.post("/readFile", async function (req, res) {
  let ln = req.tasksManager.ln + "post(/readFile)::";
  let fileName = getFileName(req);
  try {
    let data = await req.tasksManager.loadTask(fileName);
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    res.send({ err: null, data });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

router.post("/writeFile", async function (req, res) {
  let ln = req.tasksManager.ln + "post(/writeFile)::";
  let fileName = getFileName(req);
  try {
    await req.tasksManager.saveTask(fileName, req.body.content);
    res.send({ err: null, data: { fileName } });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

router.post("/deleteFile", async function (req, res) {
  let ln = req.tasksManager.ln + "post(/deleteFile)::";
  let fileName = getFileName(req);
  try {
    await req.tasksManager.deleteTask(fileName);
    res.send({ err: null, data: { fileName } });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

router.post("/acceptFile", async function (req, res) {
  let ln = req.tasksManager.ln + "post(/acceptFile)::";
  let fileName = getFileName(req);
  try {
    await req.tasksManager.setActiveTask(fileName);
    res.send({ err: null, data: { fileName } });
  } catch (error) {
    let err =
      error && error.msg
        ? error.msg
        : localizedError(error && error.message ? error.message : String(error));
    log("e", ln + err.ua);
    res.send({ err, data: null });
  }
});

router.post("/getProcessState", function (req, res) {
  let ln = req.tasksManager.ln + "post(/getProcessState)::";
  try {
    let acceptedProgram = req.tasksManager.activeTask.fileName;
    let list = req.tasksManager.getTasksList();
    if (!list.includes(acceptedProgram)) {
      res.send({
        err: localizedError(
          "Accepted program is not in the list: " + acceptedProgram
        ),
        data: null,
      });
      return;
    }
    res.send({
      err: null,
      data: { acceptedProgram, programRunning: false },
    });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

router.post("/getTasksDescription", function (req, res) {
  let ln = req.tasksManager.ln + "post(/getTasksDescription)::";
  try {
    res.send({ err: null, data: req.tasksManager.getTasksDescription() });
  } catch (error) {
    sendErr(res, ln, error);
  }
});

module.exports = router;
