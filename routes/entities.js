var express = require('express');
var router = express.Router();
var listentities=require('../config.js');
// ------------ логгер  --------------------
const l = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)

gTrace ?  l('i',logName) : null;
//console.dir(listentities);
// /* GET /entities  выдает список печей с их характеристиками */
// router.get('/', function(req, res, next) {

//   let data
//   res.status(200).send("Ok");
// });
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=0;
   let logN=logName+"POST: /entities => ";trace = ((gTrace !== 0) ? gTrace : trace);
   //-------------------------------------
   trace ?  l('i',logN,"req.query=",req.query) : null;

  res.json(listentities);//.status(200).json();//
});

module.exports = router;

if (! module.parent) {
  console.dir(entities,{depth:4});
}
