var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");
// const fileManagerRouter = require("../../fileManager/routes/index.js");
const reportRouter = require("../../reportsManager/routes/reportsRouter.js");
let gLn = "loggerRouter.js::";

router.all("*", function (req, res, next) {
  let trace = 0,
    ln = `${req.originalUrl}::`;
  req.loggerManager = req.entity.loggerManager;
  req.fileManager = req.loggerManager.fileManager;
  trace ? log("i", ln, `Started`) : null;
  if (trace) {
    log("i", ln, `req.params=`);
    console.dir(req.params);
  }
  next();
});
router.all("/report/*", reportRouter);
// router.all("/report/*", (req, res, next) => {
//   let trace = 1,
//     ln = gLn + `req.originalUrl=${req.originalUrl}::`;
//   trace ? log("i", ln, `Started`) : null;
// });

router.post("/fileManager/getFilesList", (req, res, next) => {
  let trace = 1,
    ln = `${req.originalUrl}::`;
  trace ? log("w", ln, `Started`) : null;
  let filesList = req.loggerManager.getFilesList();
  res.json({ err: null, data: filesList });
});

router.post("/fileManager/readTasks", async (req, res, next) => {
  let trace = 1,
    ln = `${req.originalUrl}::`;
  trace ? log("w", ln, `Started`) : null;
  let data;
  try {
    data = await req.loggerManager.getTasksArchiv(req.body.fileName);
    res.json({ err: null, data: data });
  } catch (error) {
    res.json({ err: error, data: null });
  }

  // res.json({ err: null, data: "Ok" });
});

router.post("/fileManager/deleteFile", async (req, res, next) => {
  let trace = 1,
    ln = `${req.originalUrl}::`;
  trace ? log("w", ln, `Started`) : null;
  if (trace) {
    log("i", ln, `req.body=`);
    console.dir(req.body);
  }
  let result = await req.loggerManager.deleteFile(req.body.fileName);
  res.json(result);
});

router.post("/getRegs", async function (req, res, next) {
  let trace = 0,
    ln = `${req.baseUrl}::`;
  if (trace) {
    log("", ln, `req.body=`);
    console.dir(req.body);
  }
  let response = req.entity.loggerManager.getRegsValue();
  trace ? console.log(ln + `response=${response}`) : null;
  res.send(response);
});

router.get("/logs/:id", async function (req, res, next) {
  let trace = 0,
    ln = `${req.baseUrl}::`;
  if (trace) {
    log("", ln, `req.params=`);
    console.dir(req.params);
  }
  let response = await req.entity.loggerManager.getLoggerArchiv(req.params.id);
  //trace ? console.log(ln + `response=${response}`) : null;
  res.send(response);
});

/* main page  */
router.get("/", function (req, res, next) {
  //   let user = req.user.username,
  //     entityName = req.entity.fullName[req.user.lang];
  let trace = 0,
    ln = `${req.baseUrl}::`;
  // if (trace) {
  //   log("", ln, `req.entity.graphManager=`);
  //   console.dir(req.entity.graphManager);
  // }

  //   let html = req.entity.processManager.getFullHtml({ lang: req.user.lang });
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Архів записів</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>The records archive</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Архив записей</small>`,
  };

  let html = req.entity.loggerManager.getFullHtml(req);
  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  //res.send(`I'm logger manager. ${req.entity.id}/`);
});

module.exports = router;
