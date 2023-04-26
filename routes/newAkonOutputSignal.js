var express = require('express');
var router = express.Router();
// const fs = require('fs');
// const rs485 = require('../rs485/RS485_driver_get.js'); // клиент
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

// ---------------
/* GET users listing. */
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST:/newAkonOutputSignal => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
  //-----------------------------------------
  trace ? log('i', logN, req.query) : null;
   if (! req.query.newSignal) {
     res.status(400).send(
         {err:
           {
             en:'Request doesn`t have new signal data. Like this: newSignal=[{"AO":"6.75"},{"IO":"on"}]'
             ,ru:'В теле запроса нет нового сигнала. Например: newSignal=[{"AO":"6.75"},{"IO":"on"}]'
             ,ua:'В тілі запиту не вказано новий сигнал. Наприклад: newSignal=[{"AO":"6.75"},{"IO":"on"}]'
           }
         })
    return
   }//if
  // let path = "./public/logs/" + req.query.folderName + "/" + req.query.id;
  // trace ?  log('i',logN,"path=",path) : null;
  try {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    // console.log(req.user);
    console.log("Спроба завнтажити новий сигнал в прилад Акон від користувача:", req.user);
    // fs.unlinkSync(path);
    console.log("JSON.parse(req.query.newSignal):");
    console.log(JSON.parse(req.query.newSignal));
    res.status(200).send("Новий сигнал успішно завантажений в прилад.");
    return
  } catch(err) {
    res.status(500).send("Новий сигнал не був завантажений в прилад.");
    // trace ? log('i',logN,"err=",err) : null;
    console.error(err);
  }


  //let list=req.query.list.trim().split(";");
  // let list=req.query.list;
  // trace ?  log('i',logN,"list=",list) : null;
  // let response=rs485.getValues(list);
  // trace ?  console.log("----- >response") : null;
  // trace ?  console.dir(response) : null;

  
});

module.exports = router;
