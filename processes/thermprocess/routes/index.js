var express = require("express");
var router = express.Router();
// ------------ логгер  --------------------
let log = require("../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log("i", logName) : null;
// ------------- костиль для отримання термічного процессу печі -----
const thermProcess = require("../../../config.js").entities[0].thermProcess;

/* GET users listing. */
router.post("/getProgram", function (req, res, next) {
  // -- настройки логгера --------------
  let trace = 0;
  let ln = logName + "POST:/getReg => ";
  trace = gTrace !== 0 ? gTrace : trace;
  let program = thermProcess.getProgram();
  //trace ? console.log(ln, "req=") : null;
  if (trace) {
    log("i", ln, `thermProcess.getProgram()=`);
    console.dir(program);
  }
  //-----------------------------------------
  res.json(thermProcess.getProgram());
});

module.exports = router;
