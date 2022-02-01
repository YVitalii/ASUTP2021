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

const log = require("../tools/log.js");
//log.setName("TRP08.js");

const timeout = 2000; //таймаут запроса

//var values=[];// хранит текущие значения  регистров, номер элемента массива = адрес прибора в сети RS485 (id)

function fromBCD(buf) {
  //console.log(buf);
  let str = buf.toString("hex");
  //console.log(str);
  let n1000 = str[0] * 1000;
  let n100 = str[1] * 100;
  let n10 = str[2] * 10;
  let n1 = str[3] * 1;
  let res = n1000 + n100 + n10 + n1;
  //console.log("T="+res+"C");
  return res;
}

function toBCD(val) {
  let line = ("0000" + String(val)).slice(-4);
  let arr = parseInt(line, 16);
  //console.log("toBCD:"+line);
  return arr;
}

function fromClock(buf) {
  //  преобразует Buffer ([hours,minutes]) ->  минуты
  let val = fromBCD(buf);
  let hrs = parseInt(val / 100);
  let mins = val - hrs * 100;
  return hrs * 60 + mins;
}

function toClock(val) {
  // преобразует минуты -> Buffer ([hours,minutes]) например 01:22 = [0x01,0x22]
  let hrs = parseInt(val / 60);
  let mins = val - hrs * 60;
  let b = toBCD(hrs * 100 + mins); // преобразуем в десятичное число , где часы - сотни, минуты -десятки и единицы
  //console.log("toClock input=",val,", output=",b,", buffer",new Buffer([b]));
  // ------------- нужно ВОЗВРАЩАТЬ ЧИСЛО ----------------
  return b;
}

const regs = new Map(); //список регистров прибора
/* _get(),_set(val) - функции предобработки: принимают данные, преобразовывают их в формат,
                понятный прибору и  возвращают объект :
                { data:{
                      FC:(функция RS785),
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

/*  ------------------ 00 00 state состояние прибора "Пуск / Стоп"
      В приборе:
          Чтение: состояние датчика
          07Н=7- датчик в норме в режиме "стоп"
          17Н=23- датчик в норме в режиме "пуск"
          47Н=71- авария датчика в режиме "стоп"
          57Н=87- авария датчика в режиме "пуск"
          Запись: пуск /останов прибора
          11Н=17-пуск прибора (выход в режим "пуск")
          01Н=1 -останов прибора (выход в режим "стоп")
      Ответ: число состояния
*/
regs.set(
  "state", //
  {
    addr: 0x0000,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 0x1,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "";
      let data = buf[1];
      let err = null;
      switch (data) {
        case 7:
          note = "Стоп";
          break;
        case 23:
          note = "Пуск";
          break;
        case 71:
          note = "Авария в режиме Стоп";
          break;
        case 87:
          note = "Авария в режиме Пуск";
          break;
        default:
          note = "Неизвестный код состояния:" + data;
          err = note;
          data = null;
      }
      //note="state"
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      let err =
        "Недопустимый параметр для записи:" +
        data +
        " (можно: 17-Пуск;1 -Стоп)";
      if ((data == 1) | (data == 17)) {
        err = null;
      } else {
        data = null;
      }
      //
      //err= i ? null:("Ошибочный входной параметр:"+data);
      return {
        data: {
          FC: 6,
          addr: this.addr,
          data: data,
        },
        err: err,
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value

      return {
        data: { value: buf.readUInt16BE(), note: "" },
        err: null,
      };
    },
  }
);

/*  ------------------ 00 01 T текущая температура объекта только чтение
            в приборе:слово в формате BCD,
            ответ: текущая температура
    */

regs.set("T", {
  addr: 0x0001,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Текущая температура T";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    return { data: null, err: "_Set: Регистр 0x0001 T - только для чтения" };
  },
  set_: function (buf) {
    //т.к. ответ будет эхо запроса, то возвращаем в дата Value
    return this._set();
  },
}); ///regs.set("T",

/*  ------------------ 00 02 [timer] время от момента пуска программы ,
            в приборе:слово,хранится в формате Hi=часы Lo=минуты,
            ответ: количество минут (Hi*60+Lo)
*/
regs.set("timer", {
  addr: 0x0002,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Время от момента пуска программы timer";
    let data = fromClock(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в минуты";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    return {
      data: null,
      err: "_Set: Регистр 0x0002 [timer] - только для чтения",
    };
  },
  set_: function (buf) {
    //т.к. ответ будет эхо запроса, то возвращаем в дата Value
    return this._set();
  },
}); ///regs.set("timer")

/*  ------------------ 0x 00 03 [REG] закон регулирования ,
    в приборе:
        "0"- выключение регулирования;
        "1"- ПИД – закон;
        "2"- позиционный закон;
        "3"- позиционный обратный закон;
        В режиме "пуск" только чтение
        Запись в режиме "стоп"
    ответ: число с номером регистра
*/
regs.set("REG", {
  addr: 0x0003,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "";
    let data = buf[1];
    let err = null;
    switch (data) {
      case 0:
        note = "Регулирование выключено";
        break;
      case 1:
        note = "ПИД-закон";
        break;
      case 2:
        note = "Позиционный закон";
        break;
      case 3:
        note = "Позиционный обратный закон";
        break;
      default:
        note = "Неизвестный код состояния:" + data;
        err = note;
        data = null;
    }
    note = "Закон регулирования:" + note + " REG";
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let err =
      "Недопустимый параметр для записи:" +
      data +
      "(допустимый диапазон: 0..3)";
    if ((data >= 0) & (data <= 3)) {
      err = null;
    } else {
      data = null;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: data,
      },
      err: err,
    };
  }, //_set

  set_: function (buf) {
    return this.get_(buf);
  }, //set_
}); ///regs.set("REG")

/*  ------------------ 01 00 [tT] (сокр от taskT) заданная температура объекта
        в приборе:слово в формате BCD, чтение и запись в любом режиме
        ответ: текущая заданная температура
*/

regs.set("tT", {
  addr: 0x0100,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Заданная температура tT";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (!val) {
      err = "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("tT"

/*  ------------------ 0x 01 20 [H]  Задание времени нарастания температуры
            в приборе: слово ХХ . ХХ – формат часов, чтение и запись в любом режиме
            ответ: текущая заданная температура
    */

regs.set("H", {
  addr: 0x0120,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Время нарастания температуры H";
    let data = fromClock(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в минуты";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toClock(data);
    let err = null;
    if (!data) {
      err = "_set: Не могу преобразовать :[" + data + "] в буфер";
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    //т.к. ответ будет эхо запроса, то возвращаем в дата Value
    return this.get_(buf);
  },
}); ///regs.set("H")

/*  ------------------ 0x 01 40 [Y]  Задание времени удержания температуры
                в приборе: слово ХХ . ХХ – формат часов+BCD, чтение и запись в любом режиме
                ответ: текущая заданная температура
        */

regs.set("Y", {
  addr: 0x0140,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Время удержания температуры Y";
    let data = fromClock(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в минуты";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toClock(data);
    let err = null;
    if (!data) {
      err = "_set: Не могу преобразовать :[" + data + "] в буфер";
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    //т.к. ответ будет эхо запроса, то возвращаем в дата Value
    return this.get_(buf);
  },
}); ///regs.set("Y"

/*  ------------------ 0x 01 60 [o] Задание коэффициента усиления в случае выбранного
 ПИД закона/ гистерезиса в случае позиционного закона  ,
        в приборе:слово, формат ВСD
        ответ: число
    */
regs.set("o", {
  addr: 0x0160,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "при РЕГ=1 коэф.усиления/ при РЕГ=2 гистерезис o";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (!val) {
      err = "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("o"
/*  ------------------ 0x 01 80 [ti] Задание времени интегрирования в случае выбранного ПИД закона
        в приборе:слово, формат ВСDб (0х0000..0х9999)
        ответ: число
    */
regs.set("ti", {
  addr: 0x0180,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Время интегрирования ti";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (!val) {
      err = "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("ti"
/*  ------------------ 0x 01 A0 [td] Задание времени дифференцирования в случае выбранного ПИД закона
        в приборе:слово, формат ВСDб (0х0000..0х9999)
        ответ: число
    */
regs.set("td", {
  addr: 0x01a0,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Время дифференцирования td";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (!val) {
      err = "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("td"

/*  ------------------ 0x 01 06 [u] Смещение (мощность при температуре объекта равной заданной)
     в случае выбранного ПИД закона ()
            в приборе:байт, формат ВСD, 0..0x99
            ответ: число
        */
regs.set("u", {
  addr: 0x01c0,
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = "Смещение (мощность при температуре объекта равной заданной) u";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (data > 0x99) {
      err = "выход за пределы диапазона (0..0x99=153):" + data;
    }
    if (!val) {
      err = "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("u"

function has(regName) {
  return regs.has(regName);
}

function getReg(iface, id, regName, cb) {
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
  let trace = 0;
  let modul = "TRP08.getReg(id=" + id + ":regName=" + regName + "):";
  if (has(regName)) {
    let reg = regs.get(regName); //получаем описание регистра
    trace ? log(3, modul) : null;
    let res = { regName: regName, value: null }; //объект ответа
    let req; //объект запроса
    let { data, err } = reg._get();
    if (data) {
      req = data;
      req["timeout"] = timeout;
      req["id"] = id;
      trace ? log(2, modul, "req=", req) : null;
      res["req"] = req;
      iface.send(req, function (err, buf) {
        res["timestamp"] = new Date(); //отметка времени
        res["buf"] = buf;
        trace ? log(2, modul, "buf=", buf) : null;
        if (err) {
          log(0, modul, "err=", err);
          return cb(err, [res]);
        }
        let { data, error } = reg.get_(buf);
        if (!error) {
          res["value"] = data.value;
          res["note"] = data.note;
          return cb(null, [res]);
        } else {
          return cb(error, [res]);
        }
      });
    }
  }
} //getReg

function setReg(iface, id, regName, value, cb) {
  // функция осуществляет запись регистра по Modbus,
  // затем считывание этого же регистра по Modbus
  // и возвращает такой же объект как и getReg
  let trace = 0;
  let modul =
    "TRP08.setReg(id=" + id + ":regName=" + regName + ":value=" + value + "):";
  if (has(regName)) {
    let reg = regs.get(regName); //получаем описание регистра
    trace ? log(2, modul, "started") : null;
    let res = {
      regName: regName,
      value: null,
      note: "",
      timestamp: new Date(),
    }; //объект ответа
    let req; //объект запроса
    let { data, err } = reg._set(value);
    if (!err) {
      req = data;
      req["timeout"] = timeout;
      req["id"] = id;
      trace ? log(2, modul, "after (_set) req=", req, "err=", err) : null;
      res["req"] = req;
      iface.send(req, function (err, buf) {
        res["timestamp"] = new Date(); //отметка времени
        if (err) {
          trace
            ? log(
                0,
                modul,
                "error in (send) err=",
                err.message,
                "; code=",
                err.code
              )
            : null;
          //res['note']=err.msg;
          return cb(err, res);
        }
        trace ? log(2, modul, "received buf=", buf) : null;
        res["buf"] = buf;
        let { data, error } = reg.set_(buf);
        trace ? log(2, modul, "after (set_) data=", data, " err=", err) : null;
        if (!error) {
          res["value"] = data.value;
          res["note"] = data.note;
          //  return cb(null,data);
          //)//getReg
          //res['value']=data;
          //res['note']=data.note;
          trace ? log(2, modul, "res=", res) : null;
          return cb(null, res);
        } else {
          return cb(error, res);
        }
      });
    } else {
      let caption = "Error _set() ";
      log(0, modul, caption, err, data);
      return cb(err, res);
    }
  } else {
    let caption =
      "Указанный регистр отсутствует в списке регистров устройства:" + regName;
    log(0, modul, err, data);
    return cb(new Error(caption), res);
  }
} // setReg

module.exports.setReg = setReg;
module.exports.getReg = getReg;
module.exports.has = has;

if (!module.parent) {
  const iface = require("./RS485_v200.js");
  /*
      console.log("----------------------- \n Device's drivers = ");
      console.log("_get:");
      console.log(regs.get("state")._get());
      console.log("get_:");
      console.log(regs.get("state").get_(new Buffer([0x00,0x47])));// 71
      console.log("_set:");
      console.log(regs.get("state")._set(7));//
      console.log("set_:");
      console.log(regs.get("state").set_(new Buffer([0x00,0x07])));// 1500
      */
  /*// -------------- state --------------
      getReg(iface,1,"state",(err,data) =>{
        log("---> in getReg \n",data)
      })
      setReg(iface,1,"state",17,(err,data) =>{
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

  setReg(iface, 1, "H", 11, (err, data) => {
    let caption = "set H=180 minutes >> ";
    if (err) {
      log(0, caption, "err=", err.message, "; code=", err.code);
    }
    log(caption, data);
  });
  setReg(iface, 1, "Y", 11 * 60 + 11, (err, data) => {
    let caption = "set Y=11:11  >> ";
    if (err) {
      log(0, caption, "err=", err.message, "; code=", err.code);
    }
    log(caption, data);
  });

  /*  setInterval(()=>{
        log (2,(new Date()).toTimeString());

        getReg(iface,1,"T",(err,data) =>{
          log(data[0].note,"=",data[0].value,"*C");
        });
        getReg(iface,1,"timer",(err,data) =>{
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
      }, 5000)
*/

  console.log("----------------------- \n regs = ");
  for (let key of regs.keys()) {
    log("i", key);
  }
}
