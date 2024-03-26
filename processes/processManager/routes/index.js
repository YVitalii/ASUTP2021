var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");

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
  let html = req.entity.processManager.getFullHtml({ lang: req.user.lang });
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник processManager</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing for the processManager</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование processManager</small>`,
  };
  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  // res.send(`${req.baseUrl}/`);
});

module.exports = router;
