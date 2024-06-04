var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");

router.all("/:id/*", (req, res, next) => {
  let trace = 0,
    ln = `router.all("/:id/")::${req.originalUrl}::`;
  req.params.baseUrl = req.baseUrl;
  if (trace) {
    log("i", ln, `req.params=`);
    console.dir(req.params);
  }
  req.device = req.entity.devicesManager.getDevice(req.params.id);
  if (!req.device) {
    res.json({ err: `Device ${req.params.id} not defined !!`, data: null });
    return;
  }
  next();
});

router.post("/:id/getState", (req, res, next) => {
  // Можливо шлях застарів, так як state є не у всіх приладах
  let trace = 0,
    ln = `router.post("/:id/getRegs")::${req.originalUrl}::`;
  trace ? log("i", ln, `Started`) : null;

  let data = req.device.getState();
  if (trace) {
    log("i", ln, `data=`);
    console.dir(data);
  }
  res.json(data);
});

router.post("/:id/getRegs", (req, res, next) => {
  let trace = 0,
    ln = `router.post("/:id/getRegs")::${req.originalUrl}::`;
  req.params.baseUrl = req.baseUrl;
  let startTime = new Date();
  if (trace) {
    log("i", ln, `req.body.regsList=`);
    console.dir(req.body.regsList);
  }
  let dev = req.device;
  let data = dev.getRegsValues(req.body.regsList);
  if (trace) {
    log("", ln, `data=`);
    console.dir(data);
  }
  res.json(data);
});
/* main page  */
router.get("/", function (req, res, next) {
  //   let user = req.user.username,
  //     entityName = req.entity.fullName[req.user.lang];
  let trace = 0,
    ln = `${req.baseUrl}::`;
  if (trace) {
    log("i", ln, `req.entity.devicesManager=`);
    console.dir(req.entity.devicesManager);
  }

  //   let html = req.entity.processManager.getFullHtml({ lang: req.user.lang });
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник приладів</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing for the devices</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование приборов</small>`,
  };

  let html = req.entity.devicesManager.getCompactHtml(req);
  // for (let key in req.entity.devicesManager.getAll()) {
  //   content += req.entity.devicesManager.getDevice(key).getCompactHtml({
  //     baseUrl: req.entity.devicesManager.homeUrl,
  //     prefix: "devicesManager_",
  //   });
  // }

  // let html = pug.renderFile(
  //   resolvePath(
  //     req.locals.homeDir +
  //       "/devices/devicesManager/views/fullDevicesManager.pug"
  //   ),
  //   { homeUrl: req.entity.devicesManager.homeUrl, content }
  // );

  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
  //res.send(`${req.baseUrl}/`);
});

module.exports = router;
