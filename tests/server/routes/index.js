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
    log("i", ln, `req.entity=`);
    console.dir(req.entity);
  }
  let html = pug.renderFile(req.locals.mainPug, {
    pageTitle: {
      ua: `Існуючі елементи`,
      en: `Avaliable components`,
      ru: `Доступные компоненты`,
    },
    body: pug.renderFile(resolvePath("./views/index.pug"), {
      entity: req.entity,
      homeUrl: req.entity.homeUrl,
    }),
    lang: req.user.lang,
  });
  res.send(html);
});

module.exports = router;
