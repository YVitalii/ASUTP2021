
const headers=['T01','T02','T03','T04','T05','T06','T07','T08','T09',"N2","P"]; // записываемые значения
const home="./public/logs/"; //путь к папке с логами
const fs = require('fs');
const logFname=getDate()+'.log'; // имя файла ГГГГ-ММ-ДД.log
const separator="\t"; // разделитель записей ТАВ
const trace=1; // 1= включить трассировку
let fName=home+logFname; // полное имя файла лога
// заглушка для тестирования
var RS485={};
if (module.parent) {
  RS485 = require('../RS485/workerRS485.js');
} else {
  RS485.getValues = (headers) => {
            let res={};
            let max=800;
            let min=50;
            for (let i = 0; i < headers.length; i++) {
              res[headers[i]]={
                value:Math.random() * (max - min) + min
              };
            }
            return res
          }
};


//


//(trace) ? console.log("RS485: "+RS485.getValues(headers)) : null;

(trace) ? console.log("Log file name: "+fName) : null;

function getDate(day) {
  // дает  дату в формате ГГГГ-ММ-ДД
  let now=( (day) ? new Date(day) : new Date() );
  let str="";
  str+=now.getFullYear()
  str+="-"+("0"+(now.getMonth()+1)).slice(-2);
  str+="-"+("0"+now.getDate()).slice(-2);
  return str
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
  // в том же порядке,что и в headers
  let data=RS485.getValues(headers);//получаем данные
  let res=[];
  for (var i = 0; i < arr.length; i++) {
    let val=Math.round(data[arr[i]].value);
    if (! val) {val=-100}; // если таких данных нет записываем -100
    res.push(val);
  }
  return res;
}


function writeLine(time) {
  let line=time;
  line += createLine(getValues(headers),separator);
  (trace) ? console.log("line: "+line) : null;
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

// проверяем наличие каталога, и если его нет - создаем
fs.mkdir(home, {recursive:true} , function(err) {
        if (err) {
            if (err.code == 'EEXIST') {
              console.log("Folder exist")
              } // ignore the error if the folder already exists
            else {console.log(err)} // something else went wrong
        } else {console.log("Folder created")}; // successfully created folder
    });

// проверяем объем диска и если мало - удаляем самые  последние записи

function logData() {

    let now=String((new Date()).getTime());//текущее время
    let line="Время"+separator;
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
logData();


module.exports.logData=logData;
