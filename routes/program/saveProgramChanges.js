var express = require('express');
var router = express.Router();
const fs = require('fs');
// const rs485 = require('../rs485/RS485_driver_get.js'); // клиент
// ------------ логгер  --------------------
let log = require('../../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

// ---------------
/* GET users listing. */
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST:/saveProgramChanges => ";
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
   if (! req.query.id) {
    res.status(400).send(
        {err:
          {
            en:"Request doesn't have program id. Like this: id='PR1.log'"
            ,ru:"В теле запроса нет id программы. Например:  id='PR1.log'"
            ,ua:"В тілі запиту не вказано id програми. Наприклад: id='PR1.log'"
          }
        })
   return
  }//if
  if (! req.query.newData) {
    res.status(400).send(
        {err:
          {
            en:"Request doesn't have new program data."
            ,ru:"В теле запроса нет новой программы."
            ,ua:"В тілі запиту немає нової програми."
          }
        })
   return
  }//if
  let path = "./public/params/" + req.query.folderName + "/" + req.query.id;
  let newData = req.query.newData;
  trace ?  log('i',logN,"path=",path) : null;
  try {
    console.log("Спроба зберегти зміни в програмі від користувача:", req.user);
    fs.truncate(path, 0, function(){console.log("Попередні дані з файлу видалено.")});
    fs.writeFile(path, newData, err => {
      if (err) console.log(err);
      res.status(200).send("Зміни до програми " + req.query.id + " успішно збережені в файлі.");
    });
    return
  } catch(err) {
    res.status(500).send("Зміни до програми " + req.query.id + " не вийшло зберегти в файлі.");
    // trace ? log('i',logN,"err=",err) : null;
    console.error(err);
  }
});

module.exports = router;
