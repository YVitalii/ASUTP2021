const express = require("express");
const router = express.Router();
// ------------ логгер  --------------------
const log = require("../../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">::";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log(logName, "i", `Strated!`) : null;

router.get("/", (req, res, next) => {
  let trace = 1,
    ln = logName + `${req.originalUrl}::`;
  if (trace) {
    log("w", ln, `-------------------------- req.query= -------------`);
    console.dir(req.query);
  }
  res.send("In program router");
});

router.all((req, res, next) => {
  let trace = 1,
    ln = logName + `${req.originalUrl}::all()::`;
  trace ? log("e", ln, `=============== ==========`) : null;
  res.status(404).send("Not find!");
});

module.exports = router;
