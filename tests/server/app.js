/** Тестовий сервер для швидкого тестування HTML-компонентів
 *  запуск npm start
 */

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var log = require("../../tools/log.js");

// -------  routes --------------------
var indexRouter = require("./routes/index");

var usersRouter = require("./routes/users");
const addInfoToReq = require("../../addInfoToReq.js");
// ----------- models -------------------
// створюємо тестовий instance of ClaaaTasksManager
// var tasksManager = require("../testCreateTaskManager");
const users = require("../../db/users"); // користувачі
const entity = require("../testEntity/entity.js");
const tasksManagerRouter = require("../../controllers/tasksController/routes/index.js");
const processManagerRouter = require("../../processes/processManager/routes/index.js");
const devicesManagerRouter = require("../../devices/devicesManager/routes/devicesRouter.js");
const loggerManagerRouter = require("../../controllers/loggerManager/routes/loggerRouter.js");
const entityRouter = require("../../entities/general/routes/entityRouter.js");

console.log(
  `---------------- server started at ${new Date().toLocaleTimeString()} --------`
);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve("../../public"))); //path.join(__dirname, "public")));

// Отключение кэширования. ист.
// https://coderoad.ru/22632593/%D0%9A%D0%B0%D0%BA-%D0%BE%D1%82%D0%BA%D0%BB%D1%8E%D1%87%D0%B8%D1%82%D1%8C-%D0%BA%D1%8D%D1%88%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5-%D0%B2%D0%B5%D0%B1-%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86-%D0%B2-ExpressJS-NodeJS
// app.use(nocache());

app.set("etag", false);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/** Щоб пришвидшити вхід,
 * Додає до запиту: user та entity */
app.use("*", (req, res, next) => {
  let trace = 0,
    ln = 'Find user "admin":: ';
  trace ? log("i", ln, `Started`) : null;
  // ----- додаємо користувача --------
  users.findByUsername("admin", (err, data) => {
    let trace = 0,
      ln = 'Find user "admin" callback::  ';
    trace ? log("i", ln, `err=`, err) : null;

    if (err) {
      throw new Error(err.en);
    }
    req.user = data;
    // милиця для мови, в майбутньому потрібно брати з налаштувань користувача
    req.user.lang = req.user.lang ? req.user.lang : "ua";

    trace ? log("i", ln, `user=`, data) : null;
    next();
  });
  req.entity = entity;
  if (trace) {
    log("i", ln, `req.entity=`);
    console.dir(req.entity);
  }
});

// app.use("/", (req, res, next) => {
//   req.tasksManager = tasksManager;
//   next();
// });
app.use("*", addInfoToReq);

app.use("/entity/:id/tasksManager/", tasksManagerRouter);

app.use("/entity/:id/processManager/", processManagerRouter);

app.use("/entity/:id/devicesManager/", devicesManagerRouter);

app.use("/entity/:id/loggerManager/", loggerManagerRouter);

app.use("/entity/:id/", entityRouter);

app.use("/", indexRouter);
//app.use("/fileManager", fileManagerRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
