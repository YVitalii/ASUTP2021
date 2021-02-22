const execSync = require('child_process').execSync;
var express = require('express');
var router = express.Router();
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

router.post('/', function(req, res, next) {
  gTrace ? log("i",req.query.time) : null;

  res.send(setDate(req.query.time));
});

module.exports = router;

function setDate(string){
  let n=Date.parse(string);
  let res="";
 // функция требует установленного модуля pm2 для перезапуска процесса
 // после изменения текущего времени
  if (n) {
    let com='sudo hwclock --set --date "'+string+'"' // команда для установки времени в RTC
    console.log("com="+com);
    if (process.platform != "win32") {
       let output = execSync(com, { encoding: 'utf-8' }); //устанавливаем время
       console.log("--------");
       console.log(output);
       output = execSync("sudo hwclock -r", { encoding: 'utf-8' }); // считываем время из RTC
       console.log("--------");
       console.log(output);
       output = execSync("sudo hwclock --hctosys", { encoding: 'utf-8' }); // устанавливаем системное время из RTC
       console.log("--------");
       console.log(output);
       output = execSync("pm2 restart all", { encoding: 'utf-8' }); //перезапускаем процесс
       console.log("--------");
       console.log(output);
       return "Ok"
     } else {
       //cb(new Error("Команда работает только для Linux"));
       return "Команда работает только для Linux"
     }
  }
  return "Входящая строка '"+string+"' не является датой";
  //cb(new Error("Входящая строка '"+string+"' не является датой"));
  //console.error("Incoming string is not a date: "+string);
}


if (! module.parent) {
  // setDate("gh", (err)=>{
  //   //console.dir( err  );
  // });
  // setDate("2021-02-16", (err)=>{
  //   //console.dir(err);
  // });

}
