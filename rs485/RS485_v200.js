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
    send=addTask 

   2023-05-06
   Рефракторінг коду:
   1. Оновив визначення буферу, так як воно застаріло 

*/
const log = require("../tools/log");
/** buffer - місце для зберігання даних */
// застаріло var buffer = new Buffer(0); // буфер приема данных
let buffer = Buffer.from("");

const SerialPort = require("serialport");

const config = require("../conf_iface.js"); // берем настройки порта

// функція для перевірки вхідного буфера на помилки
const checkBuffer = require("./checkBuffer.js");

// функції для перетворення та розрахунку CRC
let { toTetrad, getCRC } = require("../tools/CRC.js");

// функція для форматування виводу буфера в консоль
const parseBuf = require("../tools/parseBuf.js");

/** поточне активне повідомлення
 * id: rs485 adress
 * FC: function (3,6,10)
 * addr: адреса регистру в приладі
 * data: дані
 * timeout: таймаут
 * resLength: очікуєма довжина відповіді
 */
var task = {};

/** черга повідомлень сюди зберігаються всі вхідні запити */
var queue = [];
/** start змінна в якій запамятовуться початок запиту(для розрахунку тайм-ауту)*/
var start;
/** очікуєма довжина відповіді по замовчуванню = 6 */
var resLength = 6;

var serial; // объект последовательног порта
var portOpened = false; // флаг открытия порта
/** пауза між послідовними запитами, так як інколи ТРП починає передавати частину посилки після тайм ауту і ламає передачу від сусідніх приладів */
const timeoutBetweenCalls = config.timeoutBetweenCalls;
//console.log("timeoutBetweenCalls="+timeoutBetweenCalls);

// ------------------------------------------

function isOpened() {
  return portOpened;
} // выдает состояние порта

function init() {
  // создаем объект последовательного порта
  // if (config.emulateRS485) {
  //   return (portOpened = true);
  // }
  serial = new SerialPort(
    (comName = config.path),
    config.openOptions,
    (err) => {
      if (err) {
        console.log("RS485_v200:", err);
      }
    }
  ); //new SerialPort

  serial.on("open", () => {
    //порт открыт
    portOpened = true;
    console.log("Port [" + comName + "] opened.");
    //console.log("Call iterate");
    iterate();
  }); //serial.on

  // ---------- ставим прослушивателя данных--------------
  serial.on("data", (data) => {
    //console.log("onData:"+parseBuf(data));
    // при получении порции данных заносим их в буфер
    buffer = Buffer.concat([buffer, data]);
    //if (buffer.length >= task.length) {
    // все сообщение принято, вызываем обработчика
    //обработчик = пока нет
    //}
  }); // on data
} //function init()

// ---- функция инициализации посл.порта -----------------
let delay = 5000; //ожидание между повторами подключений к порту USB
var timerID = setTimeout(function tryOpen() {
  if (!portOpened) {
    // порт не открыт - пробуем открыть
    init();
    timerID = setTimeout(tryOpen, delay);
  } else {
    // порт открыт останавливаем попытки
    clearTimeout(timerID);
  }
}, delay);

function addTask(req, cb) {
  // ------------- прием заданий ----------
  /*
         по запросу
          req={
                id-адрес ведомого устройства
                FC-функция
                addr-адрес стартового регистра,
                data - данные число или Buffer 
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

  let trace = 1; // трассировка
  let ln = "RS485_v200::addTask()::";
  if (trace) {
    log("i", ln, `req=`);
    console.dir(req);
  }
  let msg = { timeout: req.timeout ? req.timeout : 1000, cb: cb };
  // расчет длины ожидаемого ответа
  let length = 8;
  //log('length='+length);
  switch (req.FC) {
    case 3:
      // функция 3
      length = 1 + 1 + 1 + Number(req.data) * 2 + 2; //[адрес]+[функция]+[кол.запрошенных байт]+ответ*2+CRC
      //log('length='+length);
      break;
    case 6:
      length = 8; //ответ = эхо запроса
    case 10:
      //[адрес]+[функция]+[startRegister_H]+[startRegister_L]+[registerNumber_H]+[registerNumber_L]+CRC_H+CRC_L
      length = 1 + 1 + 2 + 2 + 2; //8
  }
  msg.resLength = length; // ожидаемая длина ответа

  // -------   буфер запроса  ---------------------
  let addr = toTetrad(req.addr);
  let arr = [req.id, req.FC, addr[0], addr[1]];
  if (Buffer.isBuffer(req.data)) {
    console.log("req.data is a buffer");
    for (let i = 0; i < req.data.length; i++) {
      arr.push(req.data[i]);
    }
  }
  if (Number.isInteger(req.data)) {
    let data = toTetrad(req.data);
    arr.push(data[0], data[1]);
  }
  // let arr = [req.id, req.FC, addr[0], addr[1], data[0], data[1]];
  let buf = new Buffer.from(arr);
  let crc = getCRC(buf);
  arr.push(crc[0]);
  arr.push(crc[1]);
  msg.buf = new Buffer.from(arr); //запрос
  if (trace) {
    console.log("Task created:>>");
    console.log(msg);
  }
  // ставим в очередь
  queue.push(msg);
  //let line="RS485-v200>addTask>queue.length="+queue.length+"; req="+parseBuf(msg.buf);
  //console.log(line);
} //addTask

function sendMessage(buf) {
  // отправка сообщения
  buffer = Buffer.alloc(0); // очищаем буфер
  serial.write(buf); //отсылаем запроc
  start = new Date().getTime(); //засекаем время отправки запроса;
}

function iterate() {
  //основной цикл опроса
  let trace = 0;
  trace ? console.log("In iterate") : null;
  if (queue.length < 1) {
    //если вочереди нет заданий - ждем и проверяем опять
    setTimeout(function () {
      iterate();
    }, 1000);
    trace ? console.log("Queue is empty. Wait new task 1s. ") : null;
  } else {
    task = queue.shift(); // take first task
    trace ? console.log("Task.buffer= " + parseBuf(task.buf)) : null;
    setTimeout(() => {
      transaction(task, (err, data) => {
        task.cb(err, data); //отсылаем ответ
        // вызываем следующую итерацию после задержки timeoutBetweenCalls
        iterate();
      }); //transaction
    }, timeoutBetweenCalls);
  } //else
} //iterate

function transaction(req, cb) {
  let trace = 1;
  /*
  req={    buf: Buffer // запрос
          ,timeout:1000 //ms
          ,resLength:7 //ожидаемая длина ответа};
  ответ  (err,data), где data - чистые принятые данные;
  */
  // запоминаем в глобальной области

  sendMessage(req.buf);
  trace
    ? console.log(
        "Req:" + parseBuf(req.buf.toString("hex")) + ". Write started:" + start
      )
    : null;
  trace
    ? console.log(
        "buffer.length=" + buffer.length + "  req.resLength=" + req.resLength
      )
    : null;
  let timer = setInterval(() => {
    let wait = new Date().getTime() - start;
    trace ? console.log("wait= " + wait + " ms") : null;
    //getBuf();
    // проверяем на наличие ошибки MODBUS
    if (buffer.length == 6) {
      // ДЛИНА ПРИНЯТОГО БУФЕРА=6 проверяем на ошибку MODBUS
      trace ? console.log("buffer.length=6") : null;
      let errModbus = checkBuffer(req, buffer);

      if (!(errModbus === undefined)) {
        trace ? console.log("errModbus=" + errModbus.message) : null;
        if (errModbus.code > 0 && errModbus.code < 10) {
          // 0 < код ошибки <10 значит ошибка ModBus
          if (errModbus.code != 5 && errModbus.code != 6) {
            // если код не 5 или 6 , возвращаем ошибку
            // код 5 или 6 требуют подождать еще немного
            trace
              ? console.log(
                  "MODBUS error.code=" + errModbus.message + errModbus.code
                )
              : null;
            clearInterval(timer);
            cb(errModbus, null);
          }
        }
      }
    }
    /**/
    if (buffer.length >= req.resLength) {
      trace ? console.log("Buffer received:" + parseBuf(buffer)) : null;
      clearInterval(timer);
      let err = checkBuffer(req, buffer);
      if (!err) {
        let d = extractData(buffer);
        trace ? console.log("Data received:" + parseBuf(d)) : null;
        cb(null, d);
      } else {
        trace ? console.log("Error received:" + err) : null;
        cb(err, null);
      }
    }
    if (wait >= req.timeout) {
      // ошибка таймаута
      clearInterval(timer);
      let buf =
        "Request=" + parseBuf(req.buf) + ". Response=" + parseBuf(buffer); // запоминаем буфер
      let err = new Error("Timeout: " + buf);
      err.code = 13;
      cb(err, null);
    }
  }, 100);
}

function extractData(buf) {
  // принимает буфер
  // вырезает из него данные и возвращает их
  // в виде буфера
  let trace = 0;
  trace
    ? console.log("extractData: Buffer:" + parseBuf(buf.toString("hex")))
    : null;

  let FC = buf[1]; //номер функции
  //let _err=null;
  let _data = null;
  switch (FC) {
    case 3:
      _data = buf.slice(3, buf.length - 2);
      break;
    case 6:
      _data = buf.slice(4, buf.length - 2);
      break;
    default:
      console.log(
        "Неизвестная функция=" + FC + " Buffer=[" + buf.toString("hex") + "]"
      );
  } //switch
  trace ? console.log("extractData: Data:" + _data.toString("hex")) : null;
  return _data;
} //end extractData

module.exports.send = addTask; // заглушка для совместимости
module.exports.addTask = addTask;
module.exports.init = init;
module.exports.isOpened = isOpened;

//----------------- для тестирования -----------------------------------
function tasked(adr) {
  return () => {
    addTask(
      { id: 1, FC: 3, addr: adr, data: 0x1, timeout: 1000 },
      (err, data) => {
        //if (err){ console.log(adr,"Error received: "+err.message); }
        if (data) {
          console.log("Data addr" + adr + ": " + parseBuf(data));
        }
      }
    ); //addTask
  }; //return
}

if (!module.parent) {
  //init("COM9",2400,(err) => {if (err) console.log(err);});
  // function  test(){
  //   // для тестирования
  //
  //   for (var i = 496; i < 0xfffe; i++) {
  //     console.log("i=",i);
  //     tasked(i)();
  //   }}
  // test();
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

test();*/
  addTask(
    { id: 1, FC: 3, addr: 0x1, data: 0x1, timeout: 1500 },
    (err, data) => {
      if (err) {
        console.log(err);
      }
      if (data) {
        console.log("Data addr 0x01:[" + parseBuf(data) + "]");
      }
    }
  ); //addTask
  addTask(
    { id: 1, FC: 3, addr: 0x2, data: 0x1, timeout: 1500 },
    (err, data) => {
      if (err) {
        console.log(err);
      }
      if (data) {
        console.log("Data addr 0x02:[" + parseBuf(data) + "]");
      }
    }
  ); //addTask
  addTask(
    { id: 1, FC: 3, addr: 0x3, data: 0x1, timeout: 1500 },
    (err, data) => {
      if (err) {
        console.log(err);
      }
      if (data) {
        console.log("Data addr 0x03:[" + parseBuf(data) + "]");
      }
    }
  ); //addTask
}
