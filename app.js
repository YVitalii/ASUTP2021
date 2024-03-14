var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
//const logWriter = require("./logger/logWriter.js");
const nocache = require("nocache");
const logName = "app.js::";
const ipAddr = require("./config.js").ipAddr;
const entities = require("./entities/general/entities.js");
var passport = require("./tools/passport-loc.js");
const ClassProgram = require("./entities/SShAM-7-12_2023/program/program/ClassProgram.js");
//var flash = require("express-flash");

var indexRouter = require("./entities/general/routes/entitiesRouter.js"); // require("./routes/index");

const SShAM_7_12_Router = require("./entities/SShAM-7-12_2023/routes/entityRouter.js");
// var graphRouter = require("./routes/graph");
// var akonRouter = require("./routes/akon");
// var parameterSettingRouter = require("./routes/parameterSetting");
var loginRouter = require("./routes/login");
const processRouter = require("./entities/general/routes/processRouter.js");
// var reportRouter = require("./routes/report");
// var usersRouter = require("./routes/users");
// var setTimeRouter = require("./routes/setTime.js");
// var entitiesRouter = require("./routes/entities.js"); //  список печей
//const entitiesRouter = require("./entities/general/routes"); // сторінка зі списком печей
// const deleteFileRouter = require("./routes/deleteFile.js"); // удаление файла
// const saveProgramRouter = require("./routes/saveProgram.js"); // Запись программы
// const saveProgramChangesRouter = require("./routes/program/saveProgramChanges.js"); // Зберігання змін до файлу з програмою
// const saveProgramNewRouter = require("./routes/program/saveProgramNew.js"); // Зберігання програми до нового файлу
// const deleteProgramRouter = require("./routes/program/deleteProgram.js"); // Видалення файлу з програмою
// const getProgramRouter = require("./routes/program/getProgram.js"); // Читання програми
// const newAkonOutputSignalRouter = require("./routes/newAkonOutputSignal.js"); // Запись новых данных в прибор Акон
// const getRouter = require("./routes/getReg.js"); // получение оперативных данных
// const logsRouter = require("./routes/getLog.js"); // получение оперативных данных
const { session } = require("./tools/passport-loc.js");
// const processRouter = require("./processes/thermprocess/routes"); // шлях для роботи з програмою
const developing = true;

var app = express();

const log = require("./tools/log.js");
log(
  "w",
  `=========================== Program started at ${new Date().toLocaleString()}  ===============================`
);

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
// TODO Костиль - додаємо мову користувача в майбутньому потрібно брати з бази
app.use((req, res, next) => {
  req.user.lang = "en";
  next();
});
// початкова сторінка
app.use("/", indexRouter);

// - функція для трасування entity
let traceEntity = (req, res, next) => {
  log(
    "w",
    "----app.js---------->>>req.entity.mainProcess="
    //req.entity.mainProcess
  );
  next();
};

// процес, обробка запитів програми
// app.use("/entity/:id/program/*", (req, res, next) => {
//   log("w", "================  Program =========================");
//   //res.send("Program!");
//   ClassProgram.router(req, res, next);
// });

// 2024-03-14 app.use("/entity/:id/program", ClassProgram.router);

// процес, обробка запитів програми
// app.route("/entity/:id/program/*").all((req, res, next) => {
//   log("w", "=========================================");
//   next();
// }, ClassProgram.router);

// перевіряємо чи є такий контролер, якщо нема - повідомляємо про помилку
app.use("/entity/:id/controllers/:contrId", (req, res, next) => {
  let trace = 0,
    ln = logName + `app.post(${req.originalUrl})::`;
  if (trace) {
    log("i", ln, `req.query=`);
    console.dir(req.query);
  }

  let controller = req.entity.controllers[req.params.contrId];
  if (!controller) {
    res.status(404).json({
      err: `Not found controller:${req.params.contrId}`,
      controller: null,
    });
    return;
  }
  req.controller = controller;
  next();
});

app.post("/entity/:id/controllers/:contrId/getRegs", (req, res, next) => {
  let trace = 0,
    ln = logName + `app.post(${req.originalUrl})::`;
  if (trace) {
    log("i", ln, `req.query=`);
    console.dir(req.query);
  }
  let data = req.controller.getRegs(req.query.regs);
  if (trace) {
    log("i", ln, `data=`);
    console.dir(data);
  }
  res.json(data); //next();
  return;
});

app.post("/entity/:id/controllers/:contrId/setRegs", (req, res, next) => {
  let trace = 1,
    ln = logName + `app.post(${req.originalUrl})::`;
  if (trace) {
    log("i", ln, `req.query=`);
    console.dir(req.query);
  }
  res.json(req.controller.setRegs(req.query.regs)); //next();
  return;
});

app.post("/entity/:id/controllers/:contrId", (req, res, next) => {
  let trace = 0,
    ln = logName + `app.use(${req.originalUrl})::`;
  trace ? log("w", ln, "Started") : null;
  req.entity.router(req, res, next);
  return;
});

app.use("/entity/:id/controllers", (req, res) => {
  let trace = 0,
    ln = logName + `app.use("${req.originalUrl}")::`;
  if (trace) {
    log("i", ln, `req.entity.controllers.about=`);
    console.dir(req.entity.controllers.about);
  }
  res.render("main.pug", {
    body: req.entity.controllers.about.htmlFull(),
    pageTitle:
      req.entity.fullName +
      `<br> <small> ${req.entity.controllers.about.fullName.ua} </small>`,
  });
});

// app.use("/entity/:id/program", (req, res) => {
//   let trace = 0,
//     ln = logName + `app.use("${req.originalUrl}")::`;
//   if (trace) {
//     log("i", ln, `req.entity.controllers.about=`);
//     console.dir(req.entity.controllers.about);
//   }
//   res.render("main.pug", {
//     body: req.entity.controllers.about.htmlFull(),
//     pageTitle:
//       req.entity.fullName +
//       `<br> <small> ${req.entity.controllers.about.fullName.ua} </small>`,
//   });
// });

// app.use("/entity/:id/process/", (req, res, next) => {
//   let trace = 1,
//     ln = logName + `app.use("${req.originalUrl}")::`;
//   if (trace) {
//     log("=========================", ln, "===================================");
//     log("i", ln, `req.query=`);
//     console.dir(req.query, { depth: 2 });
//   }
//   res.render("main.pug", {
//     body: req.entity.process.htmlFull(),
//   });
//   // req.entity.process.router(req, res, next);
//   res.send(ln);
// });

app.use("/entity/:id/", (req, res) => {
  res.render("main.pug", {
    body: req.entity.htmlFull(),
    pageTitle: req.entity.fullName,
  });
});

//app.use("/setTime", setTimeRouter); //страница установки времени
//app.use("/entyties");
//app.use("/graph", graphRouter); // страница с графиком
//app.use("/akon", akonRouter); // страница с настройками AKON
//app.use("/parameterSetting", parameterSettingRouter); // страница с установкой параметров терморегулятора
// app.use("/report", reportRouter); // страница с отчётом
//app.use("/", entitiesRouter); // возвращает список всех печей с их характеристиками
// app.use("/deleteFile", deleteFileRouter); // удаляет файл
// app.use("/saveProgram", saveProgramRouter); // Сохраняет новую программу
// app.use("/saveProgramChanges", saveProgramChangesRouter); // Зберігає зміни в файлі з програмою
// app.use("/saveProgramNew", saveProgramNewRouter); // Зберігає програму в новому файлі
// app.use("/deleteProgram", deleteProgramRouter); // Видаляє файл з програмою
// app.use("/getProgram", getProgramRouter); // Зчитує з файлу існуючу програму
// app.use("/newAkonOutputSignal", newAkonOutputSignalRouter); // Сохраняет новые данные в прибор Акон
// app.use("/getReg", getRouter); // возвращает текущие значения регистров
// app.use("/getLog", logsRouter); // работа с логами печей
// app.use("/process", processRouter); // робота з програмою
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
