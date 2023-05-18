var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const logWriter = require("./logger/logWriter.js");
const nocache = require("nocache");

const ipAddr = require("./config.js").ipAddr;

var passport = require("./tools/passport-loc.js");

// var flash = require('express-flash');

var indexRouter = require("./routes/index");
var graphRouter = require("./routes/graph");
var akonRouter = require("./routes/akon");
var parameterSettingRouter = require("./routes/parameterSetting");
var loginRouter = require("./routes/login");
var reportRouter = require("./routes/report");
var usersRouter = require("./routes/users");
var setTimeRouter = require("./routes/setTime.js");
var entitiesRouter = require("./routes/entities.js"); //  список печей
const deleteFileRouter = require("./routes/deleteFile.js"); // удаление файла
const saveProgramRouter = require("./routes/saveProgram.js"); // Запись программы
const saveProgramChangesRouter = require("./routes/program/saveProgramChanges.js"); // Зберігання змін до файлу з програмою
const saveProgramNewRouter = require("./routes/program/saveProgramNew.js"); // Зберігання програми до нового файлу
const deleteProgramRouter = require("./routes/program/deleteProgram.js"); // Видалення файлу з програмою
const getProgramRouter = require("./routes/program/getProgram.js"); // Читання програми
const newAkonOutputSignalRouter = require("./routes/newAkonOutputSignal.js"); // Запись новых данных в прибор Акон
const getRouter = require("./routes/getReg.js"); // получение оперативных данных
const logsRouter = require("./routes/getLog.js"); // получение оперативных данных
const { session } = require("./tools/passport-loc.js");
const processRouter = require("./processes/thermprocess/routes"); // шлях для роботи з програмою
const developing = true;
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(nocache());

// Отключение кэширования. ист. https://coderoad.ru/22632593/%D0%9A%D0%B0%D0%BA-%D0%BE%D1%82%D0%BA%D0%BB%D1%8E%D1%87%D0%B8%D1%82%D1%8C-%D0%BA%D1%8D%D1%88%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5-%D0%B2%D0%B5%D0%B1-%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86-%D0%B2-ExpressJS-NodeJS
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  require("express-session")({
    secret: "furnaceBortek",
    resave: false,
    saveUninitialized: false,
  })
);

// app.use(flash());

app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  res.set("Acess-Control-Allow-Origin", `http://${ipAddr}:3001`);
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  // console.log('------req.query-------');
  // console.log(req.query);
  // console.log('-------------');
  next();
});

// Initialize Passport and restore authentication state, if any, from the
// session.

// ------- авторизація  -----------------
app.use(passport.initialize(), (req, res, next) => {
  //console.dir(req.session);
  next();
});
app.use(passport.session(), (req, res, next) => {
  //console.dir(req.session);
  next();
});

app.use("/login", loginRouter);
app.use(passport.testLogin); // проверяем авторизованный пользователь или нет, если нет перенаправляем на страничку /login
app.use("/", indexRouter);
app.use("/setTime", setTimeRouter); //страница установки времени
app.use("/graph", graphRouter); // страница с графиком
app.use("/akon", akonRouter); // страница с настройками AKON
app.use("/parameterSetting", parameterSettingRouter); // страница с установкой параметров терморегулятора
app.use("/report", reportRouter); // страница с отчётом
app.use("/entyties", entitiesRouter); // возвращает список всех печей с их характеристиками
app.use("/deleteFile", deleteFileRouter); // удаляет файл
app.use("/saveProgram", saveProgramRouter); // Сохраняет новую программу
app.use("/saveProgramChanges", saveProgramChangesRouter); // Зберігає зміни в файлі з програмою
app.use("/saveProgramNew", saveProgramNewRouter); // Зберігає програму в новому файлі
app.use("/deleteProgram", deleteProgramRouter); // Видаляє файл з програмою
app.use("/getProgram", getProgramRouter); // Зчитує з файлу існуючу програму
app.use("/newAkonOutputSignal", newAkonOutputSignalRouter); // Сохраняет новые данные в прибор Акон
app.use("/getReg", getRouter); // возвращает текущие значения регистров
app.use("/getLog", logsRouter); // работа с логами печей
app.use("/process", processRouter); // робота з програмою
//app.use('/users', usersRouter);

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

app.disable("view cache");

module.exports = app;
