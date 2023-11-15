const express = require("express");
const router = express.Router();
// ------------ логгер  --------------------
const log = require("../.../../../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">::";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log(logName, "i", `Strated!`) : null;

router.post("/", (req, res, next) => {
  let trace = 1,
    ln = logName + "post(/applyProgram)::";
  if (trace) {
    log("w", ln, `-------------------------- req.query= -------------`);
    console.dir(req.query);
  }
  res.send("In process router");
});

module.exports = router;
