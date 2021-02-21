const conf = require('../config.js').logger;
const fs = require('fs');
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

function testFile(path,headers) {
  // проверяет наличие файла лога по пути path и если
  // его нет создает его + записывает строку с заголовками headers
  // path - строка с путем к файлу лога.
  // headers - строка со списком заголовков (пишутся в первой строке файла)
  return new Promise( (resolve,reject) =>{
    let trace=0; logN="testFile("+path+",'"+headers+"')";
    trace ? log("i","Enter to ",logN) : null;
    fs.open(path,"ax", (err,fd) => {
      if (err) {
        if (err.code === "EEXIST") {
          // если файл не существует
          log("i","Enter to ",logN,"File exist");
          resolve(true); // все хорошо файл существует
          return
        } else {
          // непонятная ошибка передаем дальше
          console.dir(err);
          throw err;
          return
        };
      }//if (err)
      // файл не существует, пишем заголовки
      fs.write(fd,headers,(err)=>{
        if (err){ throw err }
        fs.close(fd,()=>{console.log("File closed");});
        resolve("true"); // удача
      });
    }) // fs.open

  })//Promise
}//testDirectory

function writeLine(fName,line,cb){
  // записывает строку в файл
  // fName имя файла
  // line строку которую записать
  // cb = (err)
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"writeLine("+line+") => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
   trace ? log("i",logN,"Enter") : null;
  fs.open(fName,'a',(err,fd) => {
    if (err) {
      log("e","Cant open log file:"+fName+"."+err.message);
      cb(err);
      return};
    fs.write (fd,line, (err) => {
      if (err) {
        log("e","Cant write to log file:"+fName+"."+err.message);
        fs.close(fd);
        cb(err);
      }
      trace ? log("i",logN,"Line saved") : null;
      fs.close(fd,()=>{});
      cb();
    })//fs.write
  })//  fs.open
}//writeLine


module.exports.testFile=testFile;
module.exports.writeLine=writeLine;
// ---------------  тестирование -----------------------
if (! module.parent) {
  console.dir(conf);
  testFile(conf.path+"\\2021-02-20.log","time\t1-T\t2-T\r\n");
}
