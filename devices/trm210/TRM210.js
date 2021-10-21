/* -------------- драйвер прибора ТРП-08ТП

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
  -------- 2019-08-14   -----------------------
  работающая версия
  -------- 2019-10-06 --------------------------
  setReg, убрал эхо-запрос значения регистра, т.к. очередь - возвращается последнее установленное значение,
  логика обработки ошибки должна быть в управл.программе

*/

const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //глобальная трассировка (трассируется все)



const timeout=2000; //таймаут запроса

//var values=[];// хранит текущие значения  регистров, номер элемента массива = адрес прибора в сети RS485 (id)

function fromBCD(buf){
  //console.log(buf);
  let str=buf.toString('hex');
  //console.log(str);
  let n1000=(str[0])*1000;
  let n100=(str[1])*100;
  let n10=(str[2])*10;
  let n1=str[3]*1;
  let res= n1000+n100+n10+n1
  //console.log("T="+res+"C");
  return res;
};

function toBCD(val){

  let line=("0000"+String(val)).slice(-4);
  let arr=parseInt(line,16);
  //console.log("toBCD:"+line);
  return arr;
};


function fromClock(buf){ //  преобразует Buffer ([hours,minutes]) ->  минуты
  let val=fromBCD(buf);
  let hrs=parseInt(val/100);
  let mins=val-hrs*100;
  return hrs*60+mins
}

function toClock(val){ // преобразует минуты -> Buffer ([hours,minutes]) например 01:22 = [0x01,0x22]
  let hrs=parseInt(val/60);
  let mins=val-hrs*60;
  let b=toBCD(hrs*100+mins);// преобразуем в десятичное число , где часы - сотни, минуты -десятки и единицы
  //console.log("toClock input=",val,", output=",b,", buffer",new Buffer([b]));
  // ------------- нужно ВОЗВРАЩАТЬ ЧИСЛО ----------------
  return b;
}


const regs=new Map(); //список регистров прибора
/* _get(),_set(val) - функции предобработки: принимают данные, преобразовывают их в формат,
                понятный прибору и  возвращают объект :
                { data:{
                      FC:(функция RS485),
                      addr:(адрес регистра),
                      data:(тело запроса)},
                  err:ошибка}
   get_(buf),set_(buf) - функции постобработки: принимают данные, преобразовывают их в формат,
                   описывающий их физическое значение  и  возвращают объект :
                   { data:{
                         data: {
                              value:принятое значение,
                              note:описание},
                         },
                     err:ошибка}
*/




    /*  ------------------ 00 01 T текущая температура объекта только чтение
            в приборе:слово в формате BCD,
            ответ: текущая температура
    */

    regs.set("T",
        {
           addr:0x0001
          ,_get:function () {return {
                                "data":{
                                      "FC":3,
                                      "addr":this.addr,
                                      "data":0x1}
                                , "err" : null
                              }}
          ,get_: (buf) => {
                          // -- настройки логгера --------------
                           let trace=0;
                           let logN=logName+"get_() => ";
                           trace = ((gTrace !== 0) ? gTrace : trace);
                          //----------------------------------------
                          //trace ? log("i",logN,"(",buf,")") : null;
                          let note="Текущая температура T";
                          let data=buf.readInt16BE(0)/10;
                          let err=null;
                          if ( ! data) {
                            err = "_get: Не могу преобразовать буфер:["+buf.toString('hex')+"] в число"
                          }
                          return {
                              "data":{value:data,"note":note},"err":err}
                              }
          ,_set:function (data) {
                  return  { "data": null,
                  "err":"_Set: Регистр 0x0001 T - только для чтения"}
            }
          ,set_:function (buf)  { //т.к. ответ будет эхо запроса, то возвращаем в дата Value
                  return  this._set();
                }
        }); ///regs.set("T",
regs.set("SP", // задание
            {
               addr:0x0002
              ,_get:function () {return {
                                    "data":{
                                          "FC":3,
                                          "addr":this.addr,
                                          "data":0x1}
                                    , "err" : null
                                  }}
              ,get_: (buf) => {
                              // -- настройки логгера --------------
                               let trace=0;
                               let logN=logName+"get_() => ";
                               trace = ((gTrace !== 0) ? gTrace : trace);
                              //----------------------------------------
                              //trace ? log("i",logN,"(",buf,")") : null;
                              let note="Уставка (задание)";
                              //let data={err:null};
                              //let data=fromBCD(buf);
                              let data=buf.readInt16BE(0)/10;
                              let err=null;
                              if ( ! data.value) {
                                err = "_get: Не могу преобразовать буфер:["+buf.toString('hex')+"] в число"
                              }
                              return {
                                  "data":{value:data,"note":note},"err":err}
                                  }
              ,_set:function (data) {
                      return  { "data": null,
                      "err":"_Set: Регистр 0x0001 T - только для чтения"}
                }
              ,set_:function (buf)  { //т.к. ответ будет эхо запроса, то возвращаем в дата Value
                      return  this._set();
                    }
            }); ///regs.set("T",



function has(regName){ return regs.has(regName)};


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
    let modul="TRP08.getReg(id="+id+":regName="+regName+"):";
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
          trace ?  log(2,modul,"buf=",buf) : null;
          if (err) {
              log(0,modul,"err=",err);
              return cb(err,[res])
          }
          let {data,error} = reg.get_(buf)
          if (! error) {
            res['value']=data.value;
            res['note']=data.note;
            log("i","res=",res)
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

      // console.log("----------------------- \n Device's drivers = ");
      // console.log("_get:");
      // console.log(regs.get("T")._get());
      // console.log("get_:");
      // console.log(regs.get("T").get_(new Buffer([0x00,0x47])));// 71
      // console.log("_set:");
      // console.log(regs.get("state")._set(7));//
      // console.log("set_:");
      // console.log(regs.get("state").set_(new Buffer([0x00,0x07])));// 1500

      // -------------- state --------------
      // getReg(iface,1,"T",(err,data) =>{
      //   log("i","---> in getReg \n",data)
      // })
      /*setReg(iface,1,"state",17,(err,data) =>{
              log("---> in setReg \n",data)
      })
      getReg(iface,1,"state",(err,data) =>{
        log("---> in getReg \n",data)
      })
      getReg(iface,1,"state",(err,data) =>{
        log("---> in getReg \n",data)
      })
      */
      // ------------  T ---------------------
      /*getReg(iface,1,"T",(err,data) =>{
        log("---> getReg T: \n",data)
      })*/

      /*setReg(iface,1,"REG",5,(err,data) =>{
        if (err) {log(0,"set REG=5:","err=",err.message,"; code=",err.code)};
        log("---> setReg REG: \n",data)
      })
      setReg(iface,1,"REG",3,(err,data) =>{
        if (err) {log(0,"set REG=3:","err=",err.message,"; code=",err.code)};
        log("---> setReg REG: \n",data)
      })*/

      /*setReg(iface,1,"tT",450,(err,data) =>{
        let caption="set tT=450C >> "
        if (err) {log(0,caption,"err=",err.message,"; code=",err.code)};
        log(caption,data)
      })*/

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


      setInterval(()=>{
        log (2,(new Date()).toTimeString());

        getReg(iface,1,"T",(err,data) =>{
          //log("i","data=",data);
          log(data[0].note,"=",data[0].value,"*C");
        });
        getReg(iface,2,"T",(err,data) =>{
          //log("i","data=",data);
          log(data[0].note,"=",data[0].value,"*C");
        });
        getReg(iface,1,"SP",(err,data) =>{
          //log("i","data=",data);
          log(data[0].note,"=",data[0].value,"*C");
        });
        getReg(iface,2,"SP",(err,data) =>{
          //log("i","data=",data);
          log(data[0].note,"=",data[0].value,"*C");
        });
        /*getReg(iface,1,"timer",(err,data) =>{
          log(data[0].note,"=",data[0].value,"минут");
        });
        getReg(iface,1,"REG",(err,data) =>{
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"tT",(err,data) =>{
          log(data[0].note,"=",data[0].value);
        });

        getReg(iface,1,"H",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"Y",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"o",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"ti",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"td",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        getReg(iface,1,"u",(err,data) =>{
          //log(2,data);
          log(data[0].note,"=",data[0].value);
        });
        */
      }, 5000);

      //console.log("----------------------- \n Aliases = ");
      //console.log(aliases);
      //console.log("----------------------- \n Registers = ");
      //console.log(registers);
    }
