const express = require("express");
const router = express.Router();
const pug = require("pug");
const path = require("path");
// ------------ логгер  --------------------
const log = require("../../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">::";
let gTrace = 1; //=1 глобальная трассировка (трассируется все)
gTrace ? log("", logName, `Strated!`) : null;
let viewsDir = path.normalize(__dirname.replace("\\routes", ""));

router.get("/", (req, res, next) => {
  let trace = 1,
    ln = logName + `${req.originalUrl}::`;
  if (trace) {
    log("w", ln, `-------------------------- req.query= -------------`);
    console.dir(req.query);
  }

  let html = "";

  html = pug.renderFile(viewsDir + "\\program\\views\\full.pug", {
    entity: req.entity,
    tasks: req.entity.tasksManager.getFullHtml(),
    program: req.entity.program.getFullHtml(),
  });

  res.render("main", {
    entity: req.entity,
    pageTitle: "Програма",
    body: html,
  });
});

router.use((req, res, next) => {
  let trace = 1,
    ln = logName + `${req.originalUrl}::use()::`;
  trace ? log("e", `=============== ${ln} ===============`) : null;
  res.status(404).send("Not found!");
});

module.exports = router;
