var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const logWriter = require('./logger/logWriter.js');

var indexRouter = require('./routes/index');
var graphRouter = require('./routes/graph');
var reportRouter = require('./routes/report');
var usersRouter = require('./routes/users');
var setTimeRouter= require('./routes/setTime.js');
var entitiesRouter = require('./routes/entities.js'); //  список печей
const getRouter=require('./routes/getReg.js'); // получение оперативных данных
const logsRouter=require('./routes/getLog.js'); // получение оперативных данных
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
  res.set("Acess-Control-Allow-Origin","http://192.168.1.112:3001");
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  // console.log('------req.query-------');
  // console.log(req.query);
  // console.log('-------------');
  next();
});


app.use("/",indexRouter);
app.use("/setTime",setTimeRouter); //страница установки времени
app.use('/graph', graphRouter); // страница с графиком
app.use('/report', reportRouter); // страница с отчётом
app.use('/entyties', entitiesRouter); // возвращает список всех печей с их характеристиками
app.use('/getReg', getRouter); // возвращает текущие значения регистров
app.use('/getLog', logsRouter); // работа с логами печей
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
