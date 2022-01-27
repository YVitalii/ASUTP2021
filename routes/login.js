var express = require('express');
var router = express.Router();
const passport =require('../tools/passport-loc.js');
let config = require('../config.js'); // config.js
// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)

/* GET home page. */
router.get('/', checkNotAuthentificated,  function(req, res, next) {
  // ----------- настройки логгера локальные --------------
  let logN=logName+'get:/login:';
  let trace=1;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // ------------
  res.render('login', {});
  //res.send();
});

// Если пользователь уже в системе, перенаправлять его с страницы логина на основную
// Источник: https://www.youtube.com/watch?v=-RCnNyD0L-s&t=1612s   31:35
function checkNotAuthentificated(req, res, next) {
  if (req.user) {
    res.redirect('/');
  }
  next();
}

router.post('/',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res, next) {
    // ----------- настройки логгера локальные --------------
    let logN=logName+'post:/login:';
    let trace=1;   trace = (gTrace!=0) ? gTrace : trace;
    trace ? log("i",logN,"Started") : null;
    //next();
    res.redirect('/');
  });

router.get('/logout',
    function(req, res){
      console.log("------------------------------");
      console.log("req.logout="+req.logout);
      req.logout();
      res.redirect('/');
    });

module.exports = router;
// some changes
