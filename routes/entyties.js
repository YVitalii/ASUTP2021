var express = require('express');
var router = express.Router();
var entyties=require('../config.js').entyties;
// ------------ логгер  --------------------
const l = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)


/* GET /entyties  выдает список печей с их характеристиками */
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
  let trace=1;
  let logN=logName+"POST:/entyties => ";trace = ((gTrace !== 0) ? gTrace : trace);
  //-------------------------------------
  trace ?  l('i',logN,"req=",req) : null;
  let data
  res.status(200).send("Ok");
});

module.exports = router;

if (! module.parent) {
  console.dir(entyties,{depth:4});
}
