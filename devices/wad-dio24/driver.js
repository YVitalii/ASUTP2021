/* -------------- драйвер прибора WAD-DIO24  -----------------

  function getReg(iface,id,regName,cb) - (err,data) где data -  массив объектов
  function setReg(iface,id,regName,value,cb) - (err,data) где data -  объект
  function has(regName)

  cb (err,
      data:[{
           regName:
           value:,
           note:,
           req: буфер запроса,
           buf: буффер ответа ,
           timestamp:},...],
           )

*/
const timeout=2000; //таймаут запроса, по истечению которого считается что прибор не ответил
const regs = require('./WAD_DIO24_regs.js');
// ------------ логгер  --------------------
const log = require('../log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)

/**
  * Функция проверяет наличие регистра regName в списке доступніх регистров
*/
function has(regName){ return regs.has(regName)};

/**
  * функция считывает данные с приборов по RS485
  * @
*/
function getReg(iface,id,regName,cb){
    /* считывает данные по iface - интерфейс, который имеет функцию
    send (req,cb),
    req={
          id-адрес ведомого устройства
          FC-функция
          addr-адрес стартового регистра,
          data - данные
          timeout - таймаут
      }, cb (err,
             data:[{
                regName:
                value:,
                note:,
                req: буфер запроса,
                buf: буффер ответа ,
                timestamp:},...],
                )
    */
    let trace=0;
    let modul="WAD24.getReg(id="+id+":regName="+regName+"):"
    if (has(regName)) {
      let reg=regs.get(regName); //получаем описание регистра
      trace ?  log(3,modul) : null;
      let res={"regName":regName,value:null}; //объект ответа
      let req;//объект запроса
      let {data,err}=reg._get();
      if (data) {
        req=data;
        req["timeout"]=timeout;
        req["id"]=id;
        trace ?  log(2,modul,"req=",req) : null;
        res['req']=req;
        iface.send(req,function (err,buf) {
          res["timestamp"]=new Date();//отметка времени
          res['buf']=buf;
          trace ?  log(2,modul,"received buf=",buf) : null;
          if (err) {
              log(0,modul,"err=",err);
              return cb(err,[res])
          }
          let {data,error} = reg.get_(buf)
          if (! error) {
            res['value']=data.value;
            res['note']=data.note;
            return cb(null,[res])
          } else {
            return cb(error,[res])
          }
        })
      }
    }
} //getReg

function setReg(iface,id,regName,value,cb)
// функция осуществляет запись регистра по Modbus,
// затем считывание этого же регистра по Modbus
// и возвращает такой же объект как и getReg
  {
    let trace=0;
    let modul="TRP08.setReg(id="+id+":regName="+regName+":value="+value+"):"
    if (has(regName)) {
      let reg=regs.get(regName); //получаем описание регистра
      trace ?  log(2,modul,"started") : null;
      let res={"regName":regName,"value":null,note:"","timestamp":new Date()}; //объект ответа
      let req;//объект запроса
      let {data,err}=reg._set(value);
      if (! err){
        req=data;
        req["timeout"]=timeout;
        req["id"]=id;
        trace ?  log(2,modul,"after (_set) req=",req,"err=",err) : null;
        res['req']=req;
        iface.send(req,function (err,buf) {
            res["timestamp"]=new Date();//отметка времени
            if (err) {
              trace ?  log(0,modul,"error in (send) err=",err.message,"; code=",err.code) : null;
              //res['note']=err.msg;
              return cb(err,res)
            }
            trace ?  log(2,modul,"received buf=",buf) : null;
            res['buf']=buf;
            let {data,error} = reg.set_(buf);
            trace ?  log(2,modul,"after (set_) data=",data," err=",err) : null;
            if (! error) {
              res['value']=data.value;
              res['note']=data.note;
              //  return cb(null,data);
              //)//getReg
              //res['value']=data;
              //res['note']=data.note;
              trace ?  log(2,modul,"res=",res) : null;
              return cb(null,res)
            } else {
              return cb(error,res)
            }
        })

      } else {
        let caption="Error _set() ";
        log(0,modul,caption,err, data);
        return cb(err,res)
      }
    } else {
      let caption="Указанный регистр отсутствует в списке регистров устройства:"+regName;
      log(0,modul, err, data);
      return cb(new Error(caption),res)}
  } // setReg

module.exports.setReg=setReg;
module.exports.getReg=getReg;
module.exports.has=has;


if (! module.parent) {
      const iface=require ("./RS485_v200.js");
      const id=5; // адрес в сети rs485
      for (var i = 0; i <= 24; i++) {
        let regName="DIO"+i
        //log("i",regName)
        getReg(iface,id,regName, (err,data) => {
          //let caption="DIO1:: "
          if (err) {log(0,caption,"err=",err.message,"; code=",err.code)};
          let d=data[0];
          log("i","regName:",d.regName,"; Value=",d.value,"; note=",d.note);
          //console.dir(data);
        });
      }

      // setReg(iface,1,"H",11,(err,data) =>{
      //   let caption="set H=180 minutes >> "
      //   if (err) {log(0,caption,"err=",err.message,"; code=",err.code)};
      //   log(caption,data)
      // })
      // setReg(iface,1,"Y",11*60+11,(err,data) =>{
      //   let caption="set Y=11:11  >> "
      //   if (err) {log(0,caption,"err=",err.message,"; code=",err.code)};
      //   log(caption,data)
      // })

    }

