const config = require('../config.js');
const tools=require('./logTools.js');
const fs = require('fs');
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

//const dirent = require('dirent');
const getDate = require('../tools/general.js').getDateString;

class LogWriter {
  constructor(options){
    var trace=1, logN="LogWriter.constructor: ";
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
    // --------  запись предыдущих значений (для определения простоя печи и остановки записи в лог)
    this.beforeValues=null;

    // --------  путь к файлу  ---------------------
    if (! options.path) {
      // путь не указан
      let warn="options.path="+options.path;
      options.path=config.logger.path;
      warn += "; используем путь из конфиг файла: " +options.path;
      console.warn(err);
    }
    this.path=options.path;
    this.fName=this.path+"/"+ getDate()+".log";
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

function modifyValues(values) {
  // читаем с сервера данные
  //let values=;
  for (each in values) {
    //log("i",values[each]);
    if (values[each].value === null) {
      // если считанное значение = null
       values[each].value=0;
    }
  } //  for (each in values)
  return values
};

function iterate() {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"iterate() => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
  //-----------------------------------------
  let values=modifyValues(this.server.getValues(this.listRegs));
  if ( ! this.beforeValues ) {
    // предыдущих значений еще нет, запоминаем их и выходим
    this.beforeValues=values;
    trace ? log("i",logN,"First time: beforeValues=",this.beforeValues) : null;
    return;
  };
  let sep=config.logger.separator;
  //console.log(values);
  let line=(new Date()).toJSON();
  for (var i = 0; i < this.regsArray.length; i++) {
    line+=sep+values[this.regsArray[i]].value
  };
  line+="\r\n";
  //trace ? log("i",logN,"this.fName=",this.fName,"; line=",line) : null;
  // записываем данные
  tools.writeLine(this.fName,line,(err) => {
    if (err) {
      log('e',logN,"writeLine error:",err);
      throw err};
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
