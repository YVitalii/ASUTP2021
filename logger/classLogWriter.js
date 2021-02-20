const config = require('../config.js');
const fs = require('fs');
//const dirent = require('dirent');
const getDate = require('../tools/general.js').getDateString;

class LogWriter {
  constructor(path,listRegs){
    this.listRegs=listRegs;
    this.path=path;
    let trace=1, logT="LogWriter.constructor: "
    trace ? console.info(logT,"this.path=",this.path) : null;
    trace ? console.log(logT,"this.listRegs=",this.listRegs) : null;
    // ---- проверяем наличие директории и если нужно создаем ее ----------
    testDirectory(path)
      .then(
        response => {
          let fName=this.path+"/"+ getDate()+".log";
          trace ? console.info(logT,"this.path=",fName) : null;
          // fs.open(fName,"ax+", (err,fd) => {
          //   if (! err) { return }
          //   console.log("File not exist");
          // })

          fs.access(fName,fs.constants.F_OK,(err) => {
              if (err) {return};
              trace ? console.info(logT,"fName=",fName," notExist") : null;
              console.info("Creating file:",fName);
              fs.open(fName,'w',(err,fd) => {
                  if (err) {console.error("Cant create log file:",fName); return}
              } );//fs.open
          });
        }
      )
      .then ();
  }//constructor
} //class Chart

module.exports=LogWriter;


function testDirectory(path) {
  // проверяет наличие директории и если нужно создает ее
  return new Promise( (resolve,reject) =>{
    console.log("testDirectory("+path+")");
    fs.mkdir(path,{recursive:true}, (err) => {
      if (err) { reject(err) } else { resolve (true)}
    })
  })//Promise
}//testDirectory
