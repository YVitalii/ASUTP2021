const express = require("express");
const router = express.Router();
// ------------ логгер  --------------------
const log = require("../../../tools/log"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">::";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log(logName, "i", `Strated!`) : null;

router.post("/setProgram", (req, res, next) => {
  let trace = 1,
    ln = logName + `post("${req.baseUrl}/setProgram")::`;
  if (trace) {
    log("w", ln, `req.query=`, req.query);
    log("w", ln, "req.user=", req.user);
    //console.dir(req.query);
  }
  //  - перевірка дозволу користувача
  if (!req.user.permissions.programCreate) {
    let err = {
      ua: `Користувач ${user} не може створювати програму! `,
      en: `User ${user} can't create the program`,
      ru: `Пользователь: ${user} не может создавать программу!`,
    };
    req.send({ err, data: null });
    return;
  }
  req.entity.program.setProgram(req.query);
  let response = req.entity.process.setProgram();
  res.send("In process router");
});

router.use("/step/%step/start", (req, res, next) => {
  let trace = 1,
    ln = logName + `.use("${req.baseUrl}/step/${step}")::`;
  if (trace) {
    log("w", ln, `>>>req.query=`, req.query);
    log("w", ln, "req.entity.mainProcess=", req.entity.mainProcess);
    //console.dir(req.query);
  }
  // перевіряємо права на запуск програми
  if (!req.user.permissions.programStart) {
    let err = {
      ua: `Користувач ${user} не може запускати програму! `,
      en: `User ${user} can't start program`,
      ru: `Пользователь: ${user} не может запускать программу!`,
    };
    req.send({ err, data: null });
    return;
  }
  //   let response = req.entity.process.setProgram();
  //   res.send("In process router");
});

module.exports = router;
