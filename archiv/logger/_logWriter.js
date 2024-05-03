
// --------- настройки логера глобальные -------
const log = require('../log.js');
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";//имя модуля
let gTrace=0; //глобальная трассировка (трассируется все)
// gTrace ? log("i",logName,"get item=", item) : null;
// -- настройки логгера локальные--------------
/*let logN=logName+"iterate():";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
trace ? log("w",logN,"") : null;
trace ? log("i",logN,"") : null;*/



/* -------------------------   миссия  --------------------------------
// записывает архивирует параметры процесса в текстовый файл с разделителями separator
*/
const config = require("../config.js");
const listReg=config.logger.listReg;
var headers=Array.isArray(listReg) ? listReg : listReg.split(";"); //список регистров
const home=config.logger.path; //путь к папке с логами
var _period=config.logger.period; //период логгирования
const fs = require('fs');
const logFname=getDate()+'.log'; // имя файла ГГГГ-ММ-ДД.log
const separator="\t"; // разделитель записей ТАВ
const trace=0; // 1= включить трассировку
let fName=home+logFname; // полное имя файла лога
// заглушка для тестирования
// const logDir =require('./logDir.js'); // работа со списком логов
//logDir.setHome(home);
const RS485 = require('../RS485/RS485_driver.js');

var interval; // таймер записи в файл
//

function startLog(){
  //let period=_period;
  //if (arr) { headers = arr }; // если получен
  (trace) ? console.log("startLog ") : null;
  testFolder();
  interval=setInterval(logData,_period);
  logData();
}//startLog


function testFolder(){
  (trace) ? console.log("Log file name: "+fName) : null;
  // проверяем наличие каталога, и если его нет - создаем
  fs.mkdir(home, {recursive:true} , function(err) {
          if (err) {
              if (err.code == 'EEXIST') {
                console.log("Folder exist")
                } // ignore the error if the folder already exists
              else {console.log(err)} // something else went wrong
          } else {console.log("Folder created")}; // successfully created folder
      });
}



function stopLog(){
  clearInterval(interval);
}//startLog


//(trace) ? console.log("RS485: "+RS485.getValues(headers)) : null;



function getDate(day) {
  // дает  дату в формате ГГГГ-ММ-ДД
  let now=( (day) ? new Date(day) : new Date() );
  let str="";
  str+=now.getFullYear()
  str+="-"+("0"+(now.getMonth()+1)).slice(-2);
  str+="-"+("0"+now.getDate()).slice(-2);
  return str//now.toLocaleDateString();
}//getDate

function createLine(arr,separ) {
  // принимает массив arr и выдает строку с разделителями separ
  // например item0<TAB>item1<TAB>item2<TAB>item3</n>
  let str='';
  for (var i = 0; i < arr.length; i++) {
    str+=arr[i]+separ;
  }
  str=str.slice(0,str.length-1)+'\r\n'
  return str
}

function getValues(arr){
  //запрашивает данные у RS485 и возвращает их в виде массива
  // в том же порядке,что и в arr=массив с именами регистров
  //получаем данные с реестра
  // -- настройки логгера локальные--------------
  let logN=logName+"getValues():";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started:",arr) : null;
  let data= RS485.getValues(listReg);
  trace ? log("i",logN,"data=",data) : null;
  let res=[];
  for (var i = 0; i < arr.length; i++) {
    let val=Math.round(data[arr[i]].value);
    if (! val) {val=-100}; // если таких данных нет записываем -100
    res.push(val);
  }
  trace ? log("i",logN,"res=",res) : null;
  return res
}


function writeLine(time) {
  let line=time + separator;
  line += createLine(getValues(headers),separator);
  //console.log("line: "+line);
  fs.open(fName,'a+',(err,fd) => {
    if (err) {
      console.log("Error opening file :["+err+"]");
    } else {
      fs.write(fd,line,(err,wr,str) => {
        if (err) {
          console.log("Error writing line:["+line+"]");
        }
      });
    }
  })//open
}



// проверяем объем диска и если мало - удаляем самые  последние записи

function logData() {
    (trace) ? console.log("logData: ") : null;
    let now= new Date();
    now=getDate(now)+"T"+("0"+now.getHours()).slice(-2)+":"+("0"+now.getMinutes()).slice(-2)+":"+("0"+now.getSeconds()).slice(-2); 
    let line="time"+separator;
    fs.open(fName,'ax+',(err,fd) => {
        if (err) {
          (trace) ? console.log("File exist"): null;
          writeLine(now);

        } else {
          // файл не существует пишем заголовки
          line+=createLine(headers,separator);
          fs.write(fd,line,(err,wr,str) => {
            if (err) {
              console.log("Error writing header:["+line+"]");
            }
          });
        }
      }
    )
}
// проверяем наличие файла лога и создаем/открываем на запись
//logData();

//

module.exports.logData=logData;
//module.exports.getListFile=logDir.getListFiles;
//module.exports.getFullLog=logDir.getFullLog;
module.exports.start=startLog;
module.exports.stop=stopLog;



if (! module.parent) {
  _period=1000;
  startLog();


};
