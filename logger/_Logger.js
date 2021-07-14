
// --------- настройки логера глобальные -------
const log = require('./log.js');
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";//имя модуля
let gTrace=0; //глобальная трассировка (трассируется все)
// gTrace ? log("i",logName,"get item=", item) : null;
// -- настройки логгера локальные--------------
/*let logN=logName+"iterate():";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
trace ? log("w",logN,"") : null;
trace ? log("i",logN,"") : null;*/
const fs = require('fs');
const separetor="\t";

function getDate() {
  // получает год
  let now=new Date().toISOString().slice(0,10);
  return now
}

function homeDirOk(home,cb) {
  // проверяем наличие каталога home , и если его нет - создаем
  // cb(err)  нет
  let res=true; //пусть проверка успешна
  fs.mkdir(home, {recursive:true} , function(err) {
     if (err) {
         if (err.code == 'EEXIST') {
           gTrace ? console.log("Folder exist") : null;
           return cb(null);
           } // ignore the error if the folder already exists
         else {
           console.log(err);
           res=false;// все плохо
           return cb(err)
         } // something else went wrong
     } else {
       gTrace ? console.log("Folder created"):null}; // successfully created folder
       cb(null);
   });//mkDir
} // homeDirOk( home )

function createLine(arr) {
  let res=(new Date()).toISOString().slice(0,19);
  for (var i = 0; i < arr.length; i++) {
    let item=((arr[i] === null) | (arr[i] === undefined)) ? (-100) :  arr[i]; // если нет значения то пишем -100
    res+=separator+Math.round(arr[i])
  }
  res+="\r\n";
  return str;
}

function createFile(fName,listReg,cb) {
  fs.open(fName,"ax+",(err,fd) => {
    if (err){
      // если ошибка - файл существует, возвращаем дескриптор
      cb(null,fd);
      return
    }
    // файл не существует пишем заголовки
    let line="Time"+separator+listReg;
    fs.write(fd,line,(err,wr,str) => {
            if (err) {
              console.log("Error writing header:["+line+"]");
            }
          });
  })
}


class GraphWriter {
  constructor(homeDir,suffixName,listReg,server,period,cb) {
    //this.homeDir=homeDir;//корневая пака
    //this.suffixName=suffixName;
    this.listReg=listReg; // список регистров в виде строки с разделителями  /t ;
    this.headers=Array.isArray(listReg) ? listReg : listReg.split("\t"); //список регистров
    this.server=server; //источник данных, который имеет функцию get(listReg) и выдает объект { regName1:value, regName2:value, ...}
    this.period=period; //период опроса
    this.FH=null; // дескриптор файла
    // генерируем имя файла
    /*if (homeDirOk(homeDir)){
      this.fName=homeDir+getDate()+"_"+suffixName+".log";//имя файла: /homeDir/ГГГГ-ММ-ДД_suffixName.log
      //открываем файл на дописывание
      fs.open(fName,'ax+',(err,fd) => {
      this.fileDescriptor=null; // дескриптор файла*/


  }
  start (cb) {
    // проверяем наличие каталога, и если его нет - создаем

      this.FH
    }
}





// --------------------  тестирование  ------------------------------
if (! module.parent) {


}//if (! module.parent)
