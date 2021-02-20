var express = require('express');
var router = express.Router();
// ------------ логгер  --------------------
let l = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)
gTrace ?  l('i',logName) : null;
// ---------------
/* GET users listing. */
router.post('/:name', function(req, res, next) {
  // -- если имя файла не указано -  период показать последние 3 часа
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST: /:name => ";trace = ((gTrace !== 0) ? gTrace : trace);
   //-------------------------------------
   //trace ?  l('i',logN,"req.query=",req.query) : null;
   console.dir(req.params)
  res.send('respond with a resource: Logs.name');
});
router.post('/:name/:file', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST: /:name/:file => ";trace = ((gTrace !== 0) ? gTrace : trace);
   //-------------------------------------
   //trace ?  l('i',logN,"req.query=",req.query) : null;
   console.dir(req.params)
  res.send('respond with a resource: Logs.name.files');
});

module.exports = router;
