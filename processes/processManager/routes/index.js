var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");

// router.all("*", function(req, res, next) {
// })

router.post("/getProgram", function (req, res, next) {
  res.json(req.entity.processManager.getHtmlProgram());
});

router.post("/start", async function (req, res, next) {
  let trace = 1,
    ln = `post("${req.originalUrl}")::`;
  let step = req.body.step;
  if (trace) {
    log("w", ln, `Recived command start from step N ${step}`);
    console.dir(req.body);
  }
  let result = await req.entity.processManager.start(step);
  res.json(result);
});

router.post("/stop", function (req, res, next) {
  let trace = 1,
    ln = `post("${req.originalUrl}")::`;
  if (trace) {
    log("w", ln, `Recived command stop`);
    console.dir(req.body);
  }
  let data = { ua: `Ok`, en: `Ok`, ru: `Ok` };
  req.entity.processManager.stop();
  res.json(data);
});

/* main page  */
router.get("/", function (req, res, next) {
  let user = req.user.username,
    entityName = req.entity.fullName[req.user.lang];
  let trace = 1,
    ln = 'tests/server/routes/index.js::get("/")::';
  if (trace) {
    log("i", ln, `req.entity.id=`);
    console.dir(req.entity.id);
  }
  let html = req.entity.processManager.getFullHtml(req);
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник processManager</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing for the processManager</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование processManager</small>`,
  };
  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  // res.send(`${req.baseUrl}/`);
});

module.exports = router;
