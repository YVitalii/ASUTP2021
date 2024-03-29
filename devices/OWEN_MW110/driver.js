/* -------------- драйвер приладу WAD-MIO-MAXPro-645

  function getReg(iface,id,regName,cb) - (err,data) где data -  массив объектов
                cb (err,
                    data:[{
                        regName:
                        value:,
                        note:,
                        req: буфер запроса,
                        buf: буффер ответа ,
                        timestamp:},...],
                        )
  function setReg(iface,id,regName,value,cb) - (err,data) где data -  объект

  function has(regName) - повертає true, якщо є такий регістр

  iface - интерфейс, который имеет функцию
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
const WAD_MIO = require("../../rs485/RS485_v200.js");
const log = require("../../tools/log.js");
const parseBuf = require("../../tools/parseBuf.js");

const ln = "OWEN-MW110-8A:: driver.js::";
const timeout = 1000; //таймаут запроса

const regs = new Map(); //список регистров прибора

regs.set(
  "T1", // - Поточне значення температури
  {
    addr: 1,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [1]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 1 [T1] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T1")

regs.set(
  "T2", // - Поточне значення температури
  {
    addr: 7,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [7]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 7 [T2] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T2")

regs.set(
  "T3", // - Поточне значення температури
  {
    addr: 13,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [13]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 13 [T3] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T3")

regs.set(
  "T4", // - Поточне значення температури
  {
    addr: 19,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [19]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 19 [T4] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T4")

regs.set(
  "T5", // - Поточне значення температури
  {
    addr: 25,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [25]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 25 [T5] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T5")

regs.set(
  "T6", // - Поточне значення температури
  {
    addr: 31,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [31]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 31 [T6] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T6")

regs.set(
  "T7", // - Поточне значення температури
  {
    addr: 37,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [37]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 37 [T7] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T7")

regs.set(
  "T8", // - Поточне значення температури
  {
    addr: 43,
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 2,
          note: `Зчитування поточної температури [43]`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = "Поточне значення температури";
      // console.log(buf);
      let data = buf.readUInt16BE() / 10;
      let err = null;
      return {
        data: { value: data, note: note },
        err: err,
      };
    },
    _set: function (data) {
      return {
        data: null,
        err: "_Set: Регістр 43 [T8] - тільки для читання",
      };
    },
    set_: function (buf) {
      //т.к. ответ будет эхо запроса, то возвращаем в дата Value
      return this._set();
    },
  }
); ///regs.set("T8")

function has(regName) {
  return regs.has(regName);
}

// -------------------------- setReg callback ---------------------------
/** Функція зчитування регістру з приладу
 * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
 * @param id {integer} - адрес приладу в iface
 * @param regName {String} - назва регистру, як визначено в regs
 * @returns cb {callback} (err,data), де data = Array [{regName,value,note,timestamp},...]
 */

function getReg(iface, id, regName, cb) {
  let trace = 0;
  regName = regName.trim();
  let modul = "OWEN-MW110-8A.getReg(id=" + id + ":regName=" + regName + "):";
  trace ? log(3, modul) : null;
  if (has(regName)) {
    let reg = regs.get(regName); //получаем описание регистра
    let res = { regName: regName, value: null }; //объект ответа
    let req; //объект запроса
    let { data, err } = reg._get();
    if (data) {
      req = data;
      req["timeout"] = timeout;
      req["id"] = id;
      res["req"] = req;
      trace ? log(2, modul, "req=", req) : null;
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
  } else cb(new Error(modul + "Не знайдено регістра:" + regName), null);
} //getReg

/** Промісифікована функція getReg() - див. її опис
 * @prop {Object} props - об'єкт з даними, що потрібні асинхронній функції {iface,id,regName}
 * @returns {Ppomise}
 */
function getRegPromise(props) {
  let trace = 0,
    ln = "getRegPromise(" + props.id + "-" + props.regName + ")";
  trace ? log(1, ln) : null;
  return new Promise(function (resolve, reject) {
    trace ? log(1, ln + "in Promise") : null;
    trace ? log(1, ln, props) : null;

    getReg(props.iface, props.id, props.regName, (err, data) => {
      let trace = 0;
      if (trace) {
        console.log(ln, "err=");
        console.dir(err);
      }
      if (trace) {
        console.log(ln, "data=");
        console.dir(data);
      }
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
      return;
    });
  });
}

// -------------------------- setReg callback ---------------------------
/** Функція запису регістру в прилад
 * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
 * @param id {integer} - адрес приладу в iface
 * @param regName {String} - назва регистру, як визначено в regs
 * @param value {integer} - валідне значення, що потрібно записати
 * @returns cb {callback} (err,data), де data = {regName,value,note,timestamp}
 */

function setReg(iface, id, regName, value, cb) {
  // функция осуществляет запись регистра по Modbus,
  // затем считывание этого же регистра по Modbus
  // и возвращает такой же объект как и getReg
  let trace = 0;
  let modul =
    "OWEN-MW110-8A.setReg(id=" + id + ":regName=" + regName + ":value=" + value + "):";
  regName = regName.trim();
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
      "Вказаний регістр відсутній в списку регістрів приладу:" + regName;
    log(0, modul, caption);
    return cb(new Error(caption), res);
  }
} // setReg

/** Промісифікована функція setReg() - див. її опис
 * @prop {Object} props - об'єкт з даними, що потрібні асинхронній функції {iface,id,regName,value}
 * @returns {Ppomise}
 */

function setRegPromise(props) {
  return new Promise(function (resolve, reject) {
    setReg(props.iface, props.id, props.regName, props.value, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
      return;
    });
  });
}

module.exports.setReg = setReg;
module.exports.setRegPromise = setRegPromise;
module.exports.getReg = getReg;
module.exports.getRegPromise = getRegPromise;
module.exports.has = has;

if (!module.parent) {
  //const iface = require("../../rs485/RS485_v200.js");
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

  // setReg(iface, 1, "H", 11, (err, data) => {
  //   let caption = "set H=180 minutes >> ";
  //   if (err) {
  //     log(0, caption, "err=", err.message, "; code=", err.code);
  //   }
  //   log(caption, data);
  // });
  // setReg(iface, 1, "Y", 11 * 60 + 11, (err, data) => {
  //   let caption = "set Y=11:11  >> ";
  //   if (err) {
  //     log(0, caption, "err=", err.message, "; code=", err.code);
  //   }
  //   log(caption, data);
  // });

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

  console.log("----------------------- \n regs.keys = ");
  for (let key of regs.keys()) {
    log("i", key); //+ " -> "
  }
  console.log("----------------------- \n regs = ");
  console.dir(regs, { depth: 4 });
}