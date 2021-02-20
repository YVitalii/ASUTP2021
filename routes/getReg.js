var express = require('express');
var router = express.Router();
const rs485 = require('../rs485/RS485_driver_get.js'); // клиент
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

// ---------------
/* GET users listing. */
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST:/getReg => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
  //-----------------------------------------
   if (! req.query.list) {
     res.status(400).send(
         {err:
           {
             en:"Request don't have the list of registers. Like this: list='1-T;2-T..'"
             ,ru:"В теле запроса нет списка запрашиваемых регистров. Например:  list='1-T;2-T..'"
             ,ua:"В тілі запиту не вказано перелік потрібних регистрів. Наприклад: list='1-T;2-T..'"
           }
         })
    return
   }//if

  //let list=req.query.list.trim().split(";");
  let list=req.query.list;
  trace ?  log('i',logN,"list=",list) : null;
  let response=rs485.getValues(list);
  trace ?  console.log("----- >response") : null;
  trace ?  console.dir(response) : null;

  res.json(response);
});

module.exports = router;
