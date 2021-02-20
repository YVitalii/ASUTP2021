const config = require('../config.js');
const tools=require('./logTools.js');
const fs = require('fs');
const log = require('../tools/log.js');
//const dirent = require('dirent');
const getDate = require('../tools/general.js').getDateString;

class LogWriter {
  constructor(options){
    let trace=0, logN="LogWriter.constructor: ";
    trace ? log("i",logN,"Enter.") : null;
    // --------- сервер ----------------------------
    if (! options.server) {
      let err="options.server="+options.server;
      log("e",logN,err);
      throw new Error(err);
    }
    this.server=options.server;
    // ----------   список регистров ----------
    if (! options.listRegs) {
      let err="options.listRegs="+options.listRegs;
      console.error(err);
      throw new Error(err);
    }
    this.listRegs= options.listRegs;
    this.regsArray=this.listRegs.split(';');
    this.headers="time\t"+this.listRegs.replace(/;/g,config.logger.separator)+"\r\n"; //строка для записи в файл
    trace ? log("i",logN,"this.listRegs=",this.listRegs) : null;
    trace ? log("i",logN,"this.regsArray=",this.regsArray) : null;
    trace ? log("i",logN,"this.headers=",this.headers) : null;

    // --------  путь к файлу  ---------------------
    if (! options.path) {
      // путь не указан
      let warn="options.path="+options.path;
      options.path=config.logger.path;
      warn += "; используем путь из конфиг файла: " +options.path;
      console.warn(err);
    }
    this.path=options.path;
    this.fName=this.path+"\\"+ getDate()+".log";
    trace ? console.info(logN,"this.path=",this.path) : null;
    // ---- проверяем наличие файла лога и если нужно создаем его ----------
    testDirectory(this.path)
      .then(
        response => {
          // директория создана
          trace ? console.info(logN,"this.path=",this.path) : null;
          return this.fName;
        }
      )
      .then (
        fName => {
          // создаем/проверяем наличие файла
          trace ? console.info(logN,"this.fName=",fName) : null;
          return tools.testFile(fName,this.headers);
        }
      ).then(
        // запускаем таймер опроса регистров
        fName =>{
          //console.log("setInterval");
          setInterval(iterate.bind(this), config.logger.period*1000)
        }
      );
  }//constructor
} //class Chart

module.exports=LogWriter;

function iterate() {
  let values=this.server.getValues(this.listRegs);
  let sep=config.logger.separator;
  //console.log(values);
  let line=(new Date()).toJSON();
  for (var i = 0; i < this.regsArray.length; i++) {
    line+=sep+values[this.regsArray[i]].value
  };
  line+="\r\n";
  //console.log(line);
  // записываем данные
  tools.writeLine(this.fName,line,(err) => {
    if (err) {throw err};
  });
}



function testDirectory(path) {
  // проверяет наличие директории и если нужно создает ее
  return new Promise( (resolve,reject) =>{
    console.log("testDirectory("+path+")");
    fs.mkdir(path,{recursive:true}, (err) => {
      if (err) { reject(err) } else { resolve (true)}
    })
  })//Promise
}//testDirectory
