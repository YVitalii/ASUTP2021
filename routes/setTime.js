const execSync = require('child_process').execSync;

//const output = execSync('date', { encoding: 'utf-8' });
//console.log(output);

function setDate(string,cb){
  let n=Date.parse(string);
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
       cb(null,output);
       return
     } else {
       cb(new Error("Команда работает только для Linux"));
       return
     }
  }
  cb(new Error("Входящая строка '"+string+"' не является датой"));
  console.error("Incoming string is not a date: "+string);
}


if (! module.parent) {
  // setDate("gh", (err)=>{
  //   //console.dir( err  );
  // });
  // setDate("2021-02-16", (err)=>{
  //   //console.dir(err);
  // });

}
