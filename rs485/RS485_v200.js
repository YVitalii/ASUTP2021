/* запрос, addTask(req,cb)
  req={
        id-адрес ведомого устройства
        FC-функция
        addr-адрес стартового регистра,
        data - данные число
        timeout - таймаут
    }
    возвращает cb(data,err)., где data = Buffer(ответа)
*/

/* 2019-08-01
    добавил метод send(req,cb)
    добавил считывание настроек порта  из config.js

 ------------2019-10-12 -------------

*/



var buffer=new Buffer(0); // буфер приема данных
const SerialPort= require('serialport');
const config= require ("./config");
const crc=require ('crc');
const parseBuf= require('./parseBuf.js'); // форматирует вывод буфера для консоли
var task={}; // активное сообщение
            /*
              id: адрес устройства
              FC: функция
              addr: адрес регистра
              data: данные
              timeout: таймаут
              resLength: ожидаемая длина ответа
            */
var queue=[]; // очередь сообщений
const maxErrCount=3; // максимальное количество попыток передачи, если исчерпались - ошибка
var start; // запоминается время старта передачи пакета (для таймаута)
var resLength=6; //ожидаемая длина ответа
var serial; // объект последовательног порта
var portOpened=false; // флаг открытия порта
const timeoutBetweenCalls=config.connection.timeoutBetweenCalls //пауза между запросами
//console.log("timeoutBetweenCalls="+timeoutBetweenCalls);
//
//var timer; // таймер задающий время между проверками буфера
// --------------------------------
// описание ошибок
var errors=[];
errors[0]=undefined;
errors[1]="Принятый код функции не может быть обработан";
errors[2]="Адрес данных, указанный в запросе, недоступен.";
errors[3]="Значение, содержащееся в поле данных запроса, является недопустимой величиной.";
errors[4]="Невосстанавливаемая ошибка имела место, пока ведомое устройство пыталось выполнить затребованное действие.";
errors[5]="Ведомое устройство приняло запрос и обрабатывает его, но это требует много времени. Этот ответ предохраняет ведущее устройство от генерации ошибки тайм-аута.";
errors[6]="Ведомое устройство занято обработкой команды. Ведущее устройство должно повторить сообщение позже, когда ведомое освободится.";
errors[7]="Ведомое устройство не может выполнить программную функцию, заданную в запросе. Этот код возвращается для неуспешного программного запроса, использующего функции с номерами 13 или 14. Ведущее устройство должно запросить диагностическую информацию или информацию об ошибках от ведомого.";
errors[8]="Ведомое устройство при чтении расширенной памяти обнаружило ошибку паритета. Ведущее устройство может повторить запрос, но обычно в таких случаях требуется ремонт.";
errors[9]="Неизвестная ошибка MODBUS.";
errors[10]="Ошибка адреса устройства.";
errors[11]="Ошибка CRC: Расчетное и принятое значения не совпадают.";
errors[12]="Неизвестная ошибка.";
errors[13]="Ошибка Timeout.";
errors[14]="Ошибка: порт не открыт.";
errors[15]="Ошибка: в ответе не совпадает номер функции.";
// ------------------------------------------
function toTetrad(addr){
    // преобразовывает число в буфер из двух байт
    var h=Math.floor(addr/256); //HI byte
    var l=addr-h*256; //LO byte
    var arr= new Buffer([h,l]);
    //console.log("Adress="+addr+"="+arr.toString('hex'));
    return arr;
};

function getCRC(buf){
  // рассчитывает CRC для буфера buf и возвращает в виде буфера [LO,HI]
  let crc16=crc.crc16modbus(buf);
  let arr=[];
  crc16=toTetrad(crc16);
  arr.push(crc16[1]);
  arr.push(crc16[0]);
  let bufCRC=Buffer.from(arr);
  return bufCRC
}

function isOpened(){return portOpened}; // выдает состояние порта

function init(){
  // ---------  открываем порт и готовим к работе ------------
/*  if (! comName) {
    let platform=process.platform;
    if (platform != "win32") {
      comName='/dev/ttyUSB0';
    } else {comName='COM4';}
  }
  let bod= (baudRate) ? baudRate : 2400; */

  serial= new SerialPort(
    comName=config.connection.path,
    config.connection.openOptions,
    (err) => {if (err) {console.log(err);}});

  serial.on('open',()=>{
    //порт открыт
    portOpened=true;
    console.log("Port ["+comName+ "] opened.");
    //buffer=new Buffer(0);
    //console.log("Call iterate");
    iterate();
    //cb(null);
  });

  // ---------- ставим прослушивателя --------------
  serial.on('data', (data) => {
            //console.log("onData:"+parseBuf(data));
            // при получении порции данных заносим их в буфер
            buffer=Buffer.concat([buffer,data]);
            //if (buffer.length >= task.length) {
              // все сообщение принято, вызываем обработчика
              //обработчик = пока нет
            //}
    }); // on data
          // запуск опроса очереди

};

let delay = 5000 //ожидание между повторами подключений
var timerID = setTimeout(
  function tryOpen() {
    if (! portOpened){
        init();
        timerID=setTimeout(tryOpen,delay);
        } else {
          clearTimeout(timerID)
        }
    }, delay);



function addTask(req,cb){
  // -------------- компиляция сообщения RS485 -----------
        /*
         по запросу
          req={
                id-адрес ведомого устройства
                FC-функция
                addr-адрес стартового регистра,
                data - данные
                timeout - таймаут
            }
          cb - callback
        формирует задачу в виде :
                  {timeout
                  ,callback
                  ,resLength
                  ,buf: скомпилированное сообщение для передачи по RS}
        и ставит ее в  очередь опроса queue
        */

        let trace=0; // трассировка
        /*if (! portOpened) {
          // порт не открыт - сразу ошибка
          let err=new Error(errors[14]);
          err.code=14;
          cb(err,undefined);
        };*/
        let msg={"timeout":((req.timeout) ? req.timeout : 1000),"cb":cb};
        // расчет длины ожидаемого сообщения
        let length=8;
        //log('length='+length);
        switch (req.FC){
            case 3:
                // функция 3
                length=1+1+1+Number(req.data)*2+2; //[адрес]+[функция]+[кол.запрошенных байт]+ответ*2+CRC
                //log('length='+length);
                break;
            case 6:
                length=8; //ответ = эхо запроса
        }
        msg.resLength=length; // ожидаемая длина ответа

        // -------   буфер запроса  ---------------------
        let addr=toTetrad(req.addr);
        let data=toTetrad(req.data);
        let arr=[req.id,req.FC,addr[0],addr[1],data[0],data[1]];
        let buf= new Buffer.from(arr);
        let crc=getCRC(buf);
        arr.push(crc[0]);
        arr.push(crc[1]);
        msg.buf= new Buffer.from(arr); //запрос
        if(trace) {
          console.log("Task created:>>");
          console.log(msg);
        };
        // ставим в очередь
        queue.push(msg);
        //let line="RS485-v200>addTask>queue.length="+queue.length+"; req="+parseBuf(msg.buf);
        //console.log(line);
} //addTask

function sendMessage(buf){
  // отправка сообщения
  buffer= Buffer.alloc(0); // очищаем буфер
  serial.write(buf); //отсылаем запроc
  start=(new Date()).getTime();//засекаем время отправки запроса;
};


function iterate(){
  //основной цикл опроса
  let trace=0;
  (trace) ? console.log("In iterate"):null;
  if (queue.length < 1){
    //если вочереди нет заданий - ждем и проверяем опять
    setTimeout(function (){iterate();}, 1000);
    (trace) ? console.log("Queue is empty. Wait new task 1s. "):null;
  } else {
    task=queue.shift(); // take first task
    (trace) ? console.log("Task.buffer= "+parseBuf(task.buf)):null;
    setTimeout(()=>{
    transaction(task, (err,data) => {
          task.cb(err,data); //отсылаем ответ
          // вызываем следующую итерацию после задержки timeoutBetweenCalls
          iterate();
          }
        );//transaction
    },timeoutBetweenCalls)
  } //else
};//iterate



function transaction(req,cb) {
  let trace=0;
  /*
  req={    buf: Buffer // запрос
          ,timeout:1000 //ms
          ,resLength:7 //ожидаемая длина ответа};
  ответ  (err,data), где data - чистые принятые данные;
  */
   // запоминаем в глобальной области

  let errCounter=maxErrCount;// устанавливаем счетчик ошибок
  sendMessage(req.buf);
  trace ? console.log("Req:"+parseBuf(req.buf.toString('hex'))+ ". Write started:"+start):null;
  trace ? console.log("buffer.length="+buffer.length+"  req.resLength="+req.resLength):null;
  let timer=setInterval(
    ()=>{
          let wait=(new Date()).getTime()-start
          trace ? console.log("wait= "+wait+" ms"):null;
          //getBuf();
          // проверяем на наличие ошибки MODBUS
          if (buffer.length == 6) {
            // ДЛИНА ПРИНЯТОГО БУФЕРА=6 проверяем на ошибку MODBUS
            trace ? console.log("buffer.length=6"):null;
            let errModbus=checkBuffer(req,buffer);

            if ( ! (errModbus === undefined)) {
                trace ? console.log("errModbus="+errModbus.message):null;
                if ((errModbus.code>0) && (errModbus.code <10)) {
                  // 0 < код ошибки <10 значит ошибка ModBus
                  if (errModbus.code!=5 && errModbus.code!=6){
                    // если код не 5 или 6 , возвращаем ошибку
                    // код 5 или 6 требуют подождать еще немного
                    trace ? console.log("MODBUS error.code="+errModbus.message+errModbus.code):null;
                    clearInterval(timer);
                    cb(errModbus,null)

                  }
                }
            }
          }
          /**/
          if (buffer.length >= req.resLength) {
            trace ? console.log("Buffer received:"+parseBuf(buffer)):null;
            clearInterval(timer);
            let err=checkBuffer(req,buffer);
            if ( ! err ) {
              let d = extractData(buffer);
              trace ? console.log("Data received:"+ parseBuf(d) ):null;
              cb(null,d)
            } else {

              trace ? console.log("Error received:"+ err):null;
              cb(err,null)
            };
          }
          if (wait >= req.timeout) {

            // ошибка таймаута
            // 2018-12-30 решил отказаться от повторных запросов в этом модуле, сразу выдаем ошибку Timeout
            //    т.к. это сильно задерживает процесс обмена, решение об повторном запросе должен принимать менеджер приборов
            errCounter = -1; // -=1
            let errDsc="";
            if (errCounter<=0) {
                 // все попытки исчерпаны - шлем ошибку timeout
                clearInterval(timer);
                //errDsc = ( buffer.length >= 6 ) ? checkBuffer(task,buffer) : "Timeout! No any message received. "
                let buf="Request="+parseBuf(req.buf)+". Response="+parseBuf(buffer);// запоминаем буфер
                let err=new Error(errors[13]+buf);
                err.code=13;
                cb(err,null);
            } else {
              trace ? console.log("errCounter= "+errCounter+". Resent message. "):null;
              sendMessage(req.buf); // повторный запрос
            }

            }
        } ,100);
}


function extractData(buf){
   // принимает буфер
   // вырезает из него данные и возвращает их
   // в виде буфера
   let trace=0;
   trace ? console.log("extractData: Buffer:"+parseBuf(buf.toString('hex'))):null;

   let FC=buf[1];//номер функции
   //let _err=null;
   let _data=null;
   switch (FC) {
     case 3:
        _data=buf.slice(3,buf.length-2);
        break;
     case 6:
        _data=buf.slice(4,buf.length-2);
        break;
     default:

        console.log("Неизвестная функция="+FC+" Buffer=["+buf.toString('hex')+"]");

   }//switch
   trace ? console.log("extractData: Data:"+_data.toString('hex')):null;
   return _data
 };//end extractData






function checkBuffer(req,buf){
  // проверяет принятое сообщение на ошибки протокола
  let errMsg="";
  let errVal;
  let err;
  let resBuf="Response="+parseBuf(buf)+".";
  let reqBuf="Request="+parseBuf(req.buf)+".";
  if(! testCRC(buf)){
      // CRC-суммы расчетная и полученная не совпадают
     errVal=11;
   } else {
      // проверяем совпадение адреса прибора
      if (buf[0] != req.buf[0]) {
            // адрес прибора в запросе и ответе не совпадают
            errVal=10;
          } else {
              // проверяем на совпадение номера функции
              if (buf[1] != req.buf[1]) {
                      // Error: номера функций не совпадают
                      // проверяем на ответ с ошибкой
                      let FC=buf[1]; // функция
                      if (FC>128) {
                          // это код ошибки Modbus
                          let errCode=buf[3];
                          if ((errCode >= 1) | (errCode <= 8)) {errVal=errCode} else {errVal=9};
                    } else { errVal=15}
                  }
                }
    }
  if (errVal) {err=new Error(errors[errVal]+"  "+reqBuf+resBuf); err.code=errVal}
  return err;
};// end testMessage


function testCRC(buf){
  // сверяет расчетное и принятое от девайса CRC16
  // если совпадает = true
  let arr=[];
  let bufCRC=buf.slice(buf.length-2,buf.length);
  let buf1=buf.slice(0,buf.length-2);
  //log( "bufCRC=" );
  //console.log(bufCRC);
  let buf1CRC=getCRC(buf1);
  //log( "buf1CRC=" );
  //console.log(buf1CRC);
  let result=bufCRC.equals(buf1CRC);
  //log( "buf1CRC=buf1CRC=" );
  //console.log(result);
  return result
}//testCRC

module.exports.send=addTask; // заглушка для совместимости
module.exports.addTask=addTask;
module.exports.init=init;
module.exports.isOpened=isOpened;





//----------------- для тестирования -----------------------------------
function tasked(adr){
  return ()=>{
      addTask({id:1,FC:3,addr:adr,data:0x1,timeout:1000},(err,data) =>{
          //if (err){ console.log(adr,"Error received: "+err.message); }
          if (data) {console.log("Data addr"+adr+": "+parseBuf(data));}
      })//addTask
  }//return
}

function createTestReq(buf){
  let buf2=getCRC(buf)
  let t= Buffer.concat([buf,buf2], (buf.length+2));
  return t
}

function test_checkBuffer(){
  let req={buf: new Buffer([ 0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x09])};
  console.log("Request:"+parseBuf(req.buf));
  test=createTestReq(new Buffer([ 0x02, 0x03, 0x00, 0x0c, 0x00, 0x01]));//ошибка адреса
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
  test=createTestReq(new Buffer([ 0x01, 0x05, 0x00, 0x0c, 0x00, 0x01]));//ошибка функции
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
  test=new Buffer([ 0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x19]);//ошибка CRC16
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
  test=new Buffer([ 0x01, 0x83, 0x00, 0x02, 0x71, 0xf1]);//ошибка ModBus
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
  test=new Buffer([ 0x01, 0x83, 0x00, 0x02, 0x71, 0x01]);//ошибка ModBus + ошибка CRC
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
  test=createTestReq(new Buffer([ 0x01, 0x03, 0x00, 0x0c, 0x00, 0x01]));// правильный ответ
  console.log("res="+parseBuf(test)+"-->\n"+checkBuffer(req,test));
}



if (! module.parent) {
  //test_checkBuffer();
  //init("COM9",2400,(err) => {if (err) console.log(err);});
function  test(){
  // для тестирования

  for (var i = 496; i < 0xfffe; i++) {
    console.log("i=",i);
    tasked(i)();
  }}
test();
//for
  /*tasked(256)();
  tasked(288)();
  tasked(320)();
  tasked(352)();
  tasked(384)();
  tasked(416)();

  addTask({id:2,FC:3,addr:1,data:0x1,timeout:1500},(err,data) =>{
      if (err){ console.log(err.message); }
      //if (data) {console.log("Data addr"+adr+": ["+parseBuf(data)+"]");}
  })//addTask
  addTask({id:1,FC:6,addr:256,data:0x1150,timeout:1500},(err,data) =>{
      if (err){ console.log(err.message); }
      if (data) {console.log("Data writed:"+parseBuf(data));}
  })//addTask
}

test();
  /* addTask({id:1,FC:3,addr:0x1,data:0x1,timeout:1500},(err,data) =>{
    if (err){ console.log(err); }
    if (data) {console.log("Data addr 0x1:["+parseBuf(data)+"]");}
  })//addTask
  addTask({id:1,FC:3,addr:0x2,data:0x1,timeout:1500},(err,data) =>{
    if (err){ console.log(err); }
    if (data) {console.log("Data addr 0x2:["+parseBuf(data)+"]");}
  })//addTask
  addTask({id:1,FC:3,addr:0x3,data:0x1,timeout:1500},(err,data) =>{
    if (err){ console.log(err); }
    if (data) {console.log("Data addr 0x3:["+parseBuf(data)+"]");}
  })//addTask
*/
}
