const driver = require('./WAD_DIO24.js');
// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)

// интерфейс для тестов
const iface = {};
const dev_id=4; //адрес прибора в сети RS485
// конфигурация для тестов
var regs = new Buffer.alloc(4,1);

function send(req,cb){
  // ----------- настройки логгера локальные --------------
  var logN=logName+"send(FC="+req.FC+"):";
  var trace=1;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // эмулирует обмен по RS485
  if (req.FC == 3) {
    // ------- если функция - чтение -------------
    if (req.addr == 0x4006) {
      // если адрес = 4006, то отвечаем буфером
      setTimeout(function() {return cb(null,regs)},500);
      return
    } else {
      // если адрес != 4006, то отвечаем ошибкой
      let err="Адрес данных, указанный в запросе, недоступен."
      setTimeout(function() {return cb(err,null)},500);
      return
    }
  } //if (req.FC == 3)

  if (req.FC == 6) {
    // ------- если функция - запись -------------
    let addr = req.addr - 0x4000-0xA+1;
    trace ? log("i",logN,"setting DIO",addr.toString(16)," to ", req.data) : null;
    if (addr > 24) {
      setTimeout(function(){cb("Адрес недоступен",null)},500)
      return
    }
    // получаем строку в бинарном формате
    let data=('00000000000000000000000000000000'+regs.readUInt32LE().toString(2)).slice(-32);
    trace ? log("i",logN,"parsed  data=",data) : null;
    // изменяем нужный регистр
    let pos=32+1-addr;
    let startLine=data.slice(0,pos-1);
    let endLine=data.slice(pos);
    data=startLine+req.data.toString(2)+endLine;
    //data=req.data.toString(2);
    trace ? log("i",logN,"changed data=",data) : null;
    //
    let newRegs=parseInt(data,2);
    trace ? log("i",logN,"newRegs=",newRegs) : null;

    regs.writeInt32BE(newRegs);
    trace ? log("i",logN,"new regs=",regs) : null;
  }
}//function send
iface.send=send;

let req={
  id:4,
  FC:6,
  addr:(0x400C),
  data:1,
  timeout:1000
}

iface.send(req,(err,data) => {
  if (err) { log("e","err=",err); return};
  log("i","data=",data);
});

req.FC=3;
req.addr=0x4006;

iface.send(req,(err,data) => {
  if (err) { log("e","err=",err); return};
  log("i","data=",data);
});
