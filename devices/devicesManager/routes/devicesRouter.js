var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");

router.all("/:id/", (req, res, next) => {
  let trace = 1,
    ln = `router.all("/:id/")::${req.originalUrl}::`;
  req.params.baseUrl = req.baseUrl;
  if (trace) {
    log("i", ln, `req.params=`);
    console.dir(req.params);
  }
  next();
});
router.all("/:id/getRegs", (req, res, next) => {
  let trace = 1,
    ln = `router.post("/:id/getRegs")::${req.originalUrl}::`;
  req.params.baseUrl = req.baseUrl;
  if (trace) {
    log("i", ln, `req.params=`);
    console.dir(req.params);
  }
  res.send(req.params.id + "::getRegs()::");
});
/* main page  */
router.get("/", function (req, res, next) {
  //   let user = req.user.username,
  //     entityName = req.entity.fullName[req.user.lang];
  let trace = 1,
    ln = `${req.baseUrl}::`;
  if (trace) {
    log("i", ln, `req.entity.devices=`);
    console.dir(req.entity.devices);
  }

  //   let html = req.entity.processManager.getFullHtml({ lang: req.user.lang });
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник приладів</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing for the devices</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование приборов</small>`,
  };
  let content = "";
  for (let key in req.entity.devices) {
    content += req.entity.devices[key].getCompactHtml();
  }

  let html = pug.renderFile(
    resolvePath(
      req.locals.homeDir +
        "/devices/devicesManager/views/fullDevicesManager.pug"
    ),
    { content }
  );

  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  //res.send(`${req.baseUrl}/`);
});

module.exports = router;
