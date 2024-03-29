/* -----------------  миссия ---------------------
управлять очередностью опроса циклически опрашывать регистры процесса workQueue
  ------------ интерфейс -----------
  берет очередь из config.queue.work=["","",...] и самозапускается на бесконечный  цикл.опрос
  has(name)- true если регистр есть в очереди
  --------------- 2019-10-12  --------------------------
  добавил задержку между запросами в 250 мс, значение берется из config.js RS485.connection.timeoutBetweenCalls
  т.к. ,вероятно, ТРП-08 тупят, то бывает начинают отвечать после timeout
  пробовал поставить задержку в RS485_v200и убрать сдесь - пошли ошибки. Оставил как есть. Нужно дополнительно разбираться
*/
const config = require ("../config.js");
const server=require('./RS485_server.js');
const log = require('../tools/log.js');
let modulName="<RS485_queue.js>:";
let trace=0;
const workQueue= require('./queue.js');
const timeoutBetweenCalls=config.connection.timeoutBetweenCalls //пауза между запросами
/*let regName
while (! server.has(regName)) {
  workQueue.removeItem(regName);
  log('e',modulName,"Регистра: < ",regName," > нет в списке, удален из очереди")
  regName=workQueue.getNext()
};*/
trace ? log("i",modulName,"STARTED"): null;

let q=config.queue.work;  // забираем из конфига очередь
trace ? log("i",modulName,"configQueue",q): null;
let q2=[];  // проверенная очередь
for (var i = 0; i < q.length; i++) {
  // проверяем на наличие в списке регистров, отсутствующие - удаляем
  if (server.has(q[i])) {
    q2.push(q[i]);
  } else {log('e',modulName,"Регистра: < ",q[i]," > нет в списке, удален из очереди")};
};
workQueue.add(q2); //создаем очередь

trace ? log("i",modulName,"workQueue",workQueue): null;

function task(regName,cb){
  trace ? log("i",modulName,"try read: regName=",regName) : null;
  if (regName){
      server.read(regName,(err,data) => {
        if (err) {
          trace ? log("e",modulName,(new Date()).getTime()," Ошибка task:", err) : null;
          trace ? log("e",modulName,regName,"=",data) : null;
        }
        //trace ? log("i",modulName,regName,"=",data) : null;
        if (data) {trace ? log("i",modulName,regName,"=",data.value) : null;};
        return cb();
      })//read
  } else {return cb();}
}

function iterate () {
  let regName=workQueue.getNext();
  setTimeout(()=>{task(regName,iterate)},timeoutBetweenCalls);
  /*process.nextTick(() => {
    task(regName,iterate);
  });*/
}

iterate();

function has(name){
  return workQueue.has(name);
}

module.exports.has=has;
