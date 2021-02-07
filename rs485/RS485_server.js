
/*
------------ интерфейс -----------------------
function get(name) // возвращает из таблицы registers данные  для  регистра name или null если регистр не найден
      данные:{"value":
            ,"timestamp":
            ,"errorsCounter":
            ,"note":
            ,"err": }
function read (name,cb) // считывает значение регистра name по RS-485 и заносит ответ в табллицу registers
function write(name,value,cb) // записывает значение регистра name=value по RS-485 и заносит ответ в registers
function has(name) // находит имя регистра по алиасу или имени и возвращает его если не нашла null
------------ 2019-10-07 -----------------------------------

*/
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //глобальная трассировка (трассируется все)


const config = require ("../config.js");

const iface=require ("./RS485_v200.js"); // параметры порта в  config.js



function parseName(name) {
  // парсим имя регистра for example: name="1-T"
  let p= name.split("-");
  let answ=[parseInt(p[0],10),p[1].trim()];
  //log("parseName: ",answ);
  return answ //  ответ [адрес(int),имя(string)]
} //parse name

// -------------------------------------------------------------------
// загружаем драйвера для каждого типа устройства
const deviceDrivers = new Map();
for (var i = 0; i < config.devices.length; i++) {
  if (i == 0) {
    deviceDrivers.set("all",undefined)} // 0 = широковещательный адрес require("./allDevices.js")
  else {
    let dev= config.devices[i].trim();
    if (! deviceDrivers.has(dev)) {
      // драйвер устройства еще не загружен, загружаем
      try {
        deviceDrivers.set(dev,require("./"+dev))
      } catch (err) {
      log(0,"Ошибка загрузки модуля:"+dev+" => "+err.message);
      };
    };
  }; //else
}//for

// -------------------------------------------------------------------
// таблица сопоставления адреса устройства , типа, а также отметка об активности прибора
const devices=[]; // массив: индекс - адрес устройства, а значение - объект устройства,
                  // описание полей смотри ниже

{
  let dev=config.devices;
  for (var i = 0; i < dev.length; i++) {
    let d=dev[i].trim();
    if (deviceDrivers.has(d)) {
      // драйвер устройства загружен
      devices[i]={
         driver:deviceDrivers.get(d) // драйвер устройства
        ,active:true // есть ли связь с прибором т.к. если часто опрашивать отсутствующий прибор,
                     // то очень большие задержки на таймаутах
        ,tryReq:0    // количество неотвеченных запросов с момента последнего опроса прибора
        ,lastReq: new Date()  // отметка времени последней попытки опроса тип Date()
      }
    } else {
        log(0,"Для устройства:"+d+" не загружен драйвер, пропускаем");
        devices[i]=undefined;
      }
    }//for
}


// --------------------------------------------------------------------
// таблица сопоставления тега и имени регистра, например 7SQ1 => 5-DIO1
// загружаем и проверяем список

const registers = new Map(); // список используемых физических регистров (названия как в драйвере)
                            //  здесь хранятся все данные о регистре, значение  и пр.
                            // value, timestamp,buffer,note, err
// ---------------------------
const aliases = new Map(); // список алиасов т.е. псевдонимов регистров, например: 7SQ1 => DIO1
{//block
  let tags=config.tags;
  for (let each of tags){
    let regName=each[1].trim();
    let alias=each[0].trim();
    let [adr,reg] = parseName(regName);

    let _alias="Alias = "+alias+".";
    let _reg="Alias = "+reg+".";
    let _regName="regName = "+regName+".";
    //console.log("Alias="+alias+"; adr="+adr+"; reg="+reg);
    if (! aliases.has(alias)) {
      if (devices[adr]) {
            if (devices[adr].driver.has(reg)) {
                  aliases.set(alias,regName);
                  if (! registers.has(regName)) {
                    registers.set(
                      regName,
                      {
                       value:null // значение регистра
                      ,timestamp:new Date() // время последнего опроса
                      ,errorsCounter: 0 // счетчик ошибок
                      ,note:"" // описание
                      ,err:null // ошибка, если есть
                      }
                    );
                } else {
                  log(0,_alias+_regName+" уже имеется в таблице регистров");
                };
          } else {
              log(0,_alias+_regName+"Драйвер не опознал запрашиваемый регистр:"+_reg);
          };

      } else {
            log(0,_alias+_regName+"Указанного адреса в таблице устройств не обнаружено");
          }
  } else {
          log(0,_alias+_regName+"Dublicate alias");
         }

 }//for
} //block


function saveRegister(regName,data){
  // синхронная, обновляет данные в регистре regName, возвращает true после успешной операции
  let trace=0;
  let head="server_RS485: saveRegister("+regName+"):"
  // проверяем имя регистра на наличие в реестре
  if (! registers.has(regName)) {
    // такого регистра в реестре нет
    log("e",head,"Неправильное имя регистра");
    //выходим
    return false
  }
  // получаем данные из реестра
  let regData=registers.get(regName);
  trace ? log(1,head,"incoming data=",data,"\n \t before regData=",regData) : null;
  // обновляем отметку времени
  regData.timestamp=data.timestamp;
  //обновляем описание регистра
  regData.note=data.note;

  if (data.err) {
    //если в данных ошибка
    regData.errorsCounter+=1; // увеличиваем счетчик ошибок
    regData.err={};
    regData.err.message=data.err.message;
    regData.err.code=data.err.code;
    regData.err.req=data.req; // сохраняем запрос
    regData.err.buf=data.buf; // сохраняем буфер ответа
    if (regData.errorsCounter>5) {
      // если больше 5 ошибок
      regData.value=null; // пишем: значение не определено
      regData.errorsCounter=5; // останавливаем счетчик
    };
  }
  if (! data.err) {
    // ошибок нет
    regData.value=data.value; // записываем плученное новое значение
    (regData.errorsCounter>0) ? regData.errorsCounter-=1 : 0; //при необх.уменьшаем счетчик ошибок
  }
  trace ? log(1,head,"\n\t after regData=",regData) : null;
  registers.set(regName,regData); // пишем в таблицу регистров
}


function getRegName(name) {
  // находит имя регистра по алиасу или имени и возвращает его
  // если не нашла null
  let reg=null; // имя регистра
  name=name.trim();
  if (aliases.has(name)) {reg=aliases.get(name)};
  if (registers.has(name)) {reg=name};
  return reg
}//function getReg


function read (name,cb){
  // считывает значение регистра по RS-485 и заносит ответ в registers
  let trace=0;
  let head="server_RS485:read("+name+"):"
  // нормализуем имя регистра
  let reg=getRegName(name);
  if (reg) {
    // регистр найден в реестре
    // парсим имя
    let [adr,regName] = parseName(reg);
    if ((! adr) | (! regName)) {return cb(new Error ("Немогу распарсить имя регистра: "+reg))};
    // получаем драйвер
    let device=devices[adr].driver;
    // считываем данные по RS485
    device.getReg(iface,adr,regName,(err,data) =>{
        if (err) {
          // сообщаем об ошибке
          trace ? log(0,head,"Error: code=",err.code,"; message= ",err.message):null;
          // записываем ошибку в данные
          //data['err']=err;
          //return cb(err)
        }

        trace ? log(2,head,"Received data=",data) : null;
        //обрабатываем принятые данные
        // т.к. при ошибке может возвращаться одиночный объект, то проверяем на массив
        if (Array.isArray(data)){
          // для каждого элемента в массиве ответов
            for (var i = 0; i < data.length; i++) {
                // получаем имя регистра. т.к. оно может не совпадать с запросом, например при чтении группы регистров
                let item=data[i];
                let name= ""+item.req.id+"-"+item.regName;
                if (err) {
                  item['err']={"code":err.code,"message":err.message}
                  // если была ошибка, вписываем ее в данные
                };
                // записываем в реестр принятые данные
                if (registers.has(name)) {
                  trace ? log("i",head,"записываем ",name,"=",item) : null;
                  saveRegister(name,item);
                } else {
                  log("e",head,"Регистр: "+name+" не обнаружен в реестре. Пропускаем.");
                };
              }//for
        }
        // выходим
        return cb(err,registers.get(reg));
    });//getReg
  } else {
    // регистра с таким именем не обнаружено в реестре
   return cb (new Error("Регистра: "+name+" не обнаружено"),null)
  }//else
}  //function read


function write(args,cb) {
  // записывает значение регистра  по RS-485 и заносит ответ в registers
  // принимает args="regName=value"
  // возвращает (err,data)
  let trace=0;
  let head="server_RS485:write("+args+"):";
  // парсим аргументы
  let [name,value]=args.split("=");
  // парсим имя
  let reg=getRegName(name);
  if (reg) {
    // регистр найден в реестре
    // парсим имя
    let [adr,regName] = parseName(reg);
    if ((! adr) | (! regName)) {return cb(new Error ("Немогу распарсить имя регистра: "+reg))};
    // получаем драйвер
    let device=devices[adr].driver;
    // записываем данные по RS485
    device.setReg(iface,adr,regName,value,(err,data) =>{
        if (err) {
          log("e",err.code,"->",err.message);
          data['err']=err;
        }
        trace ? log("i",head,"data=",data) : null;
        saveRegister(reg,data);
        return cb(err,data);
    });
   }
}

function get(name) {
  // возвращает из таблицы данные требуемого регистра name
  // синхронная
  let regName=getRegName(name);
  let head="server_RS485:get("+name+"):";
  if (! registers.has(regName)) {
    log("e",head,"Неправильное имя регистра:"+name);
    return null
  }
  return registers.get(regName);
}


module.exports.get=get; //синхронная
module.exports.read=read;
module.exports.write=write;
module.exports.has=getRegName;

  if (! module.parent) {
    //console.log("----------------------- \n Aliases = ");
    //console.log(aliases);
    /*console.log("----------------------- \n Device's drivers = ");
    console.log(deviceDrivers);
    console.log("----------------------- \n Device's = ");
    console.log(devices);
    console.log("----------------------- \n Aliases = ");
    console.log(aliases);
    console.log("----------------------- \n Registers = ");
    console.log(registers);*/
function testRead () {
    let t="1-T";
    read(t,(err,data) => {
      let logN=logName+" callback read(";
      if (err) {
        log("e",logN,t,"): error=");
        return
      }
      //console.log(err);
      log("i",logN,t,") data=");
      console.log(data);
    });
};
setInterval(testRead,3000);
/*
    read("taskT1",(err,data) => {});
    read("1-T",(err,data) => {});
    write("taskT1=150",(err,data) => {});
    read("2-T",(err,data) => {});
    read("state1",(err,data) => {});
    read("taskT1",(err,data) => {});
    write("taskT1=300",(err,data) => {
      console.log("----------------------- \n Registers = ");
      log(2,"1-tT=",registers.get("1-tT"));
    });
    write("state1=300",(err,data) => {
      console.log("----------------------- \n Registers = ");
      log(2,"state1=",registers.get("1-state"));

    });
    setInterval(()=>{
      let regName="T1"
        read(regName,(err,data) => {
          log(2,regName,"=",get("T1"));
        });
    },2000)
*/
  }
