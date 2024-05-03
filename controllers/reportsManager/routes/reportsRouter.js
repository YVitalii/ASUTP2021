var express = require("express");
var router = express.Router();
const pug = require("pug");
const resolvePath = require("path").resolve;
const log = require("../../../tools/log.js");
let gLn = "reportRouter.js::";

router.all("*/:fileName", function (req, res, next) {
  //console.log("-------->" + gLn);
  let trace = 1,
    ln = gLn + `${req.originalUrl}::`;
  if (trace) {
    log(ln + `req.params=`);
    console.dir(req.params);
  }

  // if (trace) {
  //   log("i", ln, `req.params=`);
  //   console.dir(req.params);
  // }
  let html = req.entity.reportsManager.getFullHtml(req);
  res.send(html);
  //   next();
});

module.exports = router;
