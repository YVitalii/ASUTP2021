const execSync = require('child_process').execSync;

//const output = execSync('date', { encoding: 'utf-8' });
//console.log(output);

function setDate(string,cb){
  let n=Date.parse(string);

  if (n) {
    let com='sudo hwclock --set --date "'+string+'"'
    console.log("com="+com);
    if (process.platform != "win32") {
       let output = execSync('date', { encoding: 'utf-8' });
       cb(null,output);
     } else {
       cb(new Error("Команда работает только для Linux"));
       return
     }
  }
  cb(new Error("Входящая строка '"+string+"' не является датой"));
  console.error("Incoming string is not a date: "+string);
}


if (! module.parent) {
  setDate("gh", (err)=>{
    //console.dir( err  );
  });
  setDate("2021-02-21", (err)=>{
    //console.dir(err);
  });

}
