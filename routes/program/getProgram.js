var express = require('express');
var router = express.Router();
const fs = require('fs');
// ------------ логгер  --------------------
let log = require('../../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

// ---------------
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST:/getProgram => ";
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
            en:"Request doesn't have program id. Like this: id='1.log'"
            ,ru:"В теле запроса нет id программы. Например:  id='1.log'"
            ,ua:"В тілі запиту не вказано id програми. Наприклад: id='1.log'"
          }
        })
   return
  }//if
  let path = "./public/params/" + req.query.folderName + "/" + req.query.id;
  trace ?  log('i',logN,"path=",path) : null;
  try {
    console.log("Спроба зчитати програму з файлу від користувача:", req.user);
    fs.readFile(path, (err, data) => {
        if (err) throw err;
        // console.log(data);
        res.status(200).send(data);
    });
    return
  } catch(err) {
    res.status(500).send("Програма " + req.query.id + " не була зчитана з файлу.");
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
