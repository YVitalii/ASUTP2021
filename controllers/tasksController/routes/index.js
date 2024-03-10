var express = require("express");
var router = express.Router();
const pathResolve = require("path").resolve;
const pug = require("pug");
const fileManagerRouter = require("../../fileManager/routes/");

/* GET home page. */
router.get("/", function (req, res, next) {
  const mainPug = pathResolve("../../../../views/main.pug");
  console.log(`Resolved mainPug= ${mainPug}`);
  res.send(pug.renderFile(mainPug, { body: req.tasksManager.getFullHtml() }));
  //res.render("index", { title: req.tasksManager.ln });
});
router.use("/fileManager", (req, res, next) => {
  req.fileManager = req.tasksManager.fileManager;
  next();
});
router.use("/fileManager", fileManagerRouter);

module.exports = router;
