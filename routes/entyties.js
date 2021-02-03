var express = require('express');
var router = express.Router();
var listEntyties=require('../config.js');
// ------------ логгер  --------------------
const l = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)

gTrace ?  l('i',logName) : null;
console.dir(listEntyties);
// /* GET /entyties  выдает список печей с их характеристиками */
// router.get('/', function(req, res, next) {

//   let data
//   res.status(200).send("Ok");
// });
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
  // let trace=1;
  // let logN=logName+"POST:/entyties => ";trace = ((gTrace !== 0) ? gTrace : trace);
  // //-------------------------------------
  // trace ?  l('i',logN,"req=",req) : null;

  res.json(listEntyties);//.status(200).json();//
});

module.exports = router;

if (! module.parent) {
  console.dir(entyties,{depth:4});
}
