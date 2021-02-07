/* --------------- миссия --------------------------------------
  промежуточное звено между потребителями данных и  сервером RS485
  отвечает на запросы get, set, проверяет данные на актуальность и тут же отправляет актуальные,
  если данные устарели инициирует запрос по RS485 для получения свежих данных,
  определяются 2 группы данных: оперативные (все что в очереди цикл.опроса) и настроечные(все остальные)
  ------  интерфейс ------


*/
const queue = require('./RS485_queue.js');// очередь опроса, для определения таймаута
const config = require('../config.js');
const server=require('./RS485_server.js'); // подключаемся к серверу
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //глобальная трассировка (трассируется все)
const workRegTimeOut=config.workRegTimeOut; // таймаут ОПЕРАТИВНЫХ регистров по истечению которого считается, что данные устарели
const otherRegTimeOut=config.otherRegTimeOut; // таймаут НАСТРОЕЧНЫХ регистров по истечению которого считается, что данные устарели
const SerialTasks = require('./serialTasks.js');
const trySomeTimes = require('./trySomeTimes.js');

function getOne(name,cb){
//  считывает из сервера одно значение регистра name, cb(err,data={name:"",value: ,...})
    let logN=logName+"getOne("+name+"):";
    let trace=0;  trace = (gTrace!=0) ? gTrace : trace;
    let timeout=otherRegTimeOut;// пусть это не оперативный регистр
    // получаем данные из реестра
    let data=server.get(name);
    trace ? log("i",logN,"start data=",data) : null;
    if (! data) {
      // данных нет
      process.nextTick(() => {cb(new Error("Имя: ["+name+"] не найдено."),null)});
      // выход
      return
    }
    // данные найдены
    data.name=name
    if (queue.has(name)) {
        // этот регистр в списке оперативных, меняем его таймаут
        timeout=workRegTimeOut;  }
    trace ? log("i",logN,"timeout=",timeout) : null;
    let now=(new Date()).getTime();// время сейчас
    let regTime=+data.timestamp; // время последнего опроса
    let isOldData=((now-regTime)>(timeout*1000)); // устаревшие данные? true/false
    trace ? log("i",logN,"Данные устарели? :",isOldData) : null;
    if ((! isOldData) & (data.value)) {
       //актуальные данные и они есть (data.value!=null) - возвращаем потребителю
      trace ? log("i",logN,"Отправляем data=",data) : null;
      process.nextTick(() => {cb(null,server.get(name))});
      return  }
    // данные устарели или их нет (data.value=null) отправляем запрос
    server.read(name,(err,data)=>{
        if (err) {
          trace ? log("e",logN,"callback server.read err=",err) : null;
          if (err.code == 13) {
            trace ? log("w",logN,"Таймаут, пробуем еще 2 раза") : null;
            // если таймаут, пробуем прочитать еще 2 раза
            new TrySomeTimes(name,2,server.read,(err,data)=>{
              let newData=server.get(name);
              cb(err,newData);
            });
            return
          } else {
            // ошибка - не таймаут. возвращаем старое значение+ошибка
            trace ? log("w",logN,"Ошибка не таймаут, возвращаем старое значение с ошибкой") : null;
            return cb(err,server.get(name));
          }//else
          return
        }
        trace ? log("i",logN,"Попытка чтения №1 успешна. Отправляем data=",data) : null;
        return cb(err,data);
      })

} //getOne

/*function taskGet(name,cb) {

   getOne(name,(err,data)=>{
     return cb(err,data);
   }
 )//getOne
}// taskGet*/



function get(request,cb){
  // request - строка с именами(алиасами) регистров разделителями: \t или ";"
  // ответ - { regName1:{value:  , ...},regName2:{value:  , ...},...}
  // -- настройки логгера --------------
  let logN=logName+"get("+request+"):";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  // -- настройки логгера --------------
  let items=[];// массив запросов
  items= request.includes("\t") ? request.split("\t") :[];
  items= request.includes(";") ? request.split(";") :[];
  if (items.length == 0) { items.push(request) } // на случай запроса с одним регистром, т.е. без разделителей
  trace ? log("i",logN,"Запрос:",items) : null;
  //const tasks=[];// список заданий чтения
  new SerialTasks(items,getOne,(err,data) => {
    if (err) { trace ? log("e",logN,"error=",err):null}
    //if (data) {log("i",logN,"callback SerialTasks data=",data)}
    return cb(err,data);
  });
  //trace ? log("i",logN,"Tasks:",tasks) : null;

}


function getValues (request){
  //принимает список имен регистров с разделителем ; или массив
  // возвращает объект со значениями переменных, считанных с реестра
  // -- настройки логгера --------------
  let logN=logName+"getValues("+request+"):";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("w",logN,"Started") : null;

  let items=[];// запрос
  let res={}; //ответ
  if (! Array.isArray(request)) {
    //если запрос - не массив - парсим
    items= request.includes(";") ? request.split(";") :[];
    if (items.length == 0) { items.push(request) } // на случай запроса с одним регистром, т.е. без разделителей
  } //if (! Array.isArray(request))
    else {items=request};
  trace ? log("w",logN,"items=",items) : null;
  // получаем данные с сервера
  for (var i = 0; i < items.length; i++) {
    let regData=server.get(items[i]);
    trace ? log("i",logN,"regData=",regData) : null;
    res[items[i]]=regData;
    //res[i]=regData.value;
  }
  trace ? log("w",logN,"res=",res) : null;
  return res
}

module.exports.get=get;
module.exports.getValues=getValues;

// ----------------  тестирование   ---------------------
if (! module.parent) {
  /*getOne("T5",(err,data) => {
    if (err) {log("e",logName,"getOne(","T5","): error=",err.message)}
    if (data) {log("i",logName,"getOne(T5).value:=",data.value)}
  });*/
  /*let t="T1;T2";
  get(t,(err,data) => {
    let logN="test::"+logName+"get(";
    log("e",logN,t,") callback error=",err);
    log("w",logN,t,") callback data=",data);
  });*/
  /*arg="T1;T2;T3"//
  get(arg,(err,data)=>{
    let logN=logName+"set("+arg+"):\n";
    if (err) {log("e",logN,"error=",err)}
    //if (data) {log("i",logN,"data=",data)}
    log('w',"callback get: ----------")
    console.group(data);
  });*/
  setInterval(()=>{
    console.log("---------------- getValues=");
    console.dir(getValues("1-T;2-T;3-T"));
  }, 3000);
  // setTimeout(()=>{
  //   log("w",logName,"getValues=",getValues("5-T"));
  // }, 10000);
/*setInterval(
    ()=>{
          get("T1;T2;T3",(err,data) =>{
                //if (err) {log("e",logName,"test get(T1,T2,T3): error=",err.message)}
                if (data) {
                    //log("i",logName,"getOne(T1,T2,T3).data=",data);
                    let line='';
                    for (var each in data) {
                      line+=each+"="+data[each].value+ "; "

                    }//for
                    log("i",logName,line);
                }//if data
              }// cb get
            )//get
          }//setInterval function
    ,5000);//setInterval

  /*setInterval(()=>{
    getOne("T1",(err,data) => {
      if (err) {log("e",logName,"getOne(","T1","): error=",err.message)}
      if (data) {log("i",logName,"getOne(T1).value:=",data.value)}
    });
    getOne("T2",(err,data) => {
      if (err) {log("e",logName,"getOne(","1-ti","): error=",err.message)}
      if (data) {log("i",logName,"getOne(T2).value:=",data.value)}
    });
    getOne("T3",(err,data) => {
      if (err) {log("e",logName,"getOne(","1-ti","): error=",err.message)}
      if (data) {log("i",logName,"getOne(T3).value:=",data.value)}
    });
  },2000);*/

}
