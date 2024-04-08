var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");

router.all("*", function (req, res, next) {
  let trace = 0,
    ln = `${req.originalUrl}::`;
  req.loggerManager = req.entity.loggerManager;
  trace ? log("i", ln, `Started`) : null;
  // if (trace) {
  //   log("i", ln, `req.params=`);
  //   console.dir(req.params);
  // }
  next();
});
router.post("/getRegs", async function (req, res, next) {
  let trace = 0,
    ln = `${req.baseUrl}::`;
  if (trace) {
    log("i", ln, `req.body=`);
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
    log("i", ln, `req.params=`);
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
  if (trace) {
    log("i", ln, `req.entity.graphManager=`);
    console.dir(req.entity.graphManager);
  }

  //   let html = req.entity.processManager.getFullHtml({ lang: req.user.lang });
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник графіку</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing graph</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование графика</small>`,
  };

  //   let content = "";
  //   for (let key in req.entity.devicesManager.getAll()) {
  //     content += req.entity.devicesManager.getDevice(key).getCompactHtml({
  //       baseUrl: req.entity.devicesManager.homeUrl,
  //       prefix: "devicesManager_",
  //     });
  //   }

  let html = req.entity.loggerManager.getFullHtml(req);
  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  //res.send(`I'm logger manager. ${req.entity.id}/`);
});

module.exports = router;
