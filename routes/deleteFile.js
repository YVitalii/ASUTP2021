var express = require('express');
var router = express.Router();
const fs = require('fs');
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
   let logN=logName+"POST:/deleteFile => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
  //-----------------------------------------
  trace ? log('i', logN, req.query) : null;
   if (! req.query.folderName) {
     res.status(400).send(
         {err:
           {
             en:"Request don't have the folder name. Like this: folderName='SSHCM-8-15-10'"
             ,ru:"В теле запроса нет имени папки с файлом. Например:  folderName='SSHCM-8-15-10'"
             ,ua:"В тілі запиту не вказано імені папки з файлом. Наприклад: folderName='SSHCM-8-15-10'"
           }
         })
    return
   }//if
   if (! req.query.fileName) {
    res.status(400).send(
        {err:
          {
            en:"Request don't have the file name. Like this: fileName='2021-02-12.log'"
            ,ru:"В теле запроса нет имени файла. Например:  fileName='2021-02-12.log'"
            ,ua:"В тілі запиту не вказано імені файлу. Наприклад: fileName='2021-02-12.log'"
          }
        })
   return
  }//if
  let path = "./public/logs/" + req.query.folderName + "/" + req.query.fileName;
  trace ?  log('i',logN,"path=",path) : null;
  try {
    // console.log("Попытка удалить файл от пользователя:", req.user);
    fs.unlinkSync(path);
    res.status(200).send("Файл " + path + " удалён.");
    return
  } catch(err) {
    res.status(500).send("Файл " + path + " не удалён.");
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
