/* -------------- драйвер прибора ТРП-08ТП

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
              
  -------- 2019-08-14   -----------------------
  работающая версия
  -------- 2019-10-06 --------------------------
  setReg, убрал эхо-запрос значения регистра, т.к. очередь - возвращается последнее 
  установленное значение,
  логика обработки ошибки должна быть в управл.программе
  ----- 2023-04-19 --------------------------------
  потрібно додати функцію, яка буде виводити дані  про регістри, опис, адресу, формат даних в консоль при запуску driver.js
  ----- 2024-03-29 --------------------------------------------------------
  розширив опис регістрів, додавши в деякі поля: header:{ua,en}
*/

// ----- стандартні позначення, щоб міняти в одному місці  -------
let degC = "\u00b0C"; // °C - позначення градуса

const log = require("../../tools/log.js");
//log.setName("TRP08.js");
const ln = "driver.js::";
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
  let arr;
  try {
    arr = parseInt(line, 16);
  } catch (error) {
    arr = null;
  }

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
    title: "Стан приладу: ",
    header: {
      ua: `Стан приладу`,
      en: `State of device`,
      ru: `Состояние прибора`,
    },
    units: "",

    type: "states",
    _get: function () {
      return {
        data: {
          FC: 3,
          addr: this.addr,
          data: 0x1,
          note:
            this.title +
            `Читання: 07Н=7- датчик в норме в режиме "стоп"
          17Н=23- датчик в норме в режиме "пуск"
          47Н=71- авария датчика в режиме "стоп"
          57Н=87- авария датчика в режиме "пуск"
          Запись: пуск /останов прибора
          11Н=17-пуск прибора (выход в режим "пуск")
          01Н=1 -останов прибора (выход в режим "стоп")`,
        },
        err: null,
      };
    },
    get_: (buf) => {
      let note = this.title;
      let data = buf[1];
      let err = null;
      //this.value = this.states[data];
      switch (data) {
        case 7:
          note += "Стоп";
          break;
        case 23:
          note += "Пуск";
          break;
        case 71:
          note += "Авария в режиме Стоп";
          break;
        case 87:
          note += "Авария в режиме Пуск";
          break;
        default:
          note += "Неизвестный код состояния:" + data;
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

/*  ------------------ 00 01 T поточна температура, тільки читання
            в приборе:слово в формате BCD,
            ответ: текущая температура
    */

regs.set("T", {
  addr: 0x0001,
  units: degC,
  title: "Поточна температура",
  header: {
    ua: `Поточна температура`,
    en: `Current temperature`,
    ru: `Текущая температура`,
  },
  type: "integer",
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
        note: this.title,
      },
      err: null,
    };
  },
  get_: (buf) => {
    //let note = "Текущая температура T";
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: this.note },
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
  units: "хв",
  title: "Час що пройшов від початку кроку",
  type: "clock",
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
    let data = fromClock(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в минуты";
    }
    return {
      data: { value: data, note: this.title },
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

/*  ------------------ 0x 00 03 [regMode] закон регулирования ,
    в приборе:
        "0"- выключение регулирования;
        "1"- ПИД – закон;
        "2"- позиционный закон;
        "3"- позиционный обратный закон;
        В режиме "пуск" только чтение
        Запись в режиме "стоп"
    ответ: число с номером регистра
*/
regs.set("regMode", {
  addr: 0x0003,
  units: "",
  title: "Закон регулювання:",
  type: "integer",
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
    let note = this.title;
    let data = buf[1];
    let err = null;
    switch (data) {
      case 0:
        note += "Регулювання вимкнено";
        break;
      case 1:
        note = "ПІД-закон";
        break;
      case 2:
        note = "Позиційний прямий закон";
        break;
      case 3:
        note = "Позиційний зворотній закон";
        break;
      default:
        note = "Невідомий код стану:" + data;
        err = note;
        data = null;
    }
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
  title: "Цільова температура",
  header: {
    ua: `Цільова температура`,
    en: `Goal temperature`,
    ru: ``,
  },
  units: degC,
  type: "integer",
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
    let note = this.title;
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
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
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
  title: "Час розігрівання",
  units: "хв",
  type: "clock",
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
    let note = this.title;
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
    // if (!data) {
    //   err = ln + "_set: Не могу преобразовать :[" + data + "] в буфер";
    // }
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
  title: "Час витримки",
  units: "хв",
  type: "clock",
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
    let note = this.title;
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
    // if (!data) {
    //   err = ln + "_set: Не могу преобразовать :[" + data + "] в буфер";
    // }
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
  title: "при РЕГ=1 коеф.підсилення / при РЕГ=2 гістерезис",
  units: "",
  type: "integer",
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
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
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
        в приборе:слово, формат ВСD: (0х0000..0х9999)
        ответ: число
    */
regs.set("ti", {
  addr: 0x0180,
  title: "рег ПІД. Час інтегрування",
  units: "",
  type: "integer",
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
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: this.title },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
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
        в приборе:слово, формат ВСD, (0х0000..0х9999)
        ответ: число
    */

regs.set("td", {
  addr: 0x01a0,
  title: "рег ПІД. Час диференціювання",
  units: "",
  type: "integer",
  legend: "td",
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
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: this.title },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
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
  title: "рег ПІД. Зміщення",
  units: "",
  type: "integer",
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
      data: { value: data, note: this.title },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (data > 0x99) {
      err = ln + "выход за пределы диапазона (0..0x99=153):" + data;
    }
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
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

// -------------------------- пetReg callback ---------------------------
/** Функція зчитування регістру з приладу
 * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
 * @param id {integer} - адрес приладу в iface
 * @param regName {String} - назва регистру, як визначено в regs
 * @returns cb {callback} (err,data), де data = Array [{regName,value,note,timestamp},...]
 */

function getReg(iface, id, regName, cb) {
  let trace = 0;
  regName = regName.trim();
  let modul = "trp08.driver.getReg(id=" + id + ":regName=" + regName + "):";
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
          //log(0, modul, "err=", err, "buf=", buf);
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
    ln = "getRegPromise(" + props.id + "-" + props.regName + ")::";
  trace ? log(1, ln) : null;
  return new Promise(function (resolve, reject) {
    trace ? log(1, ln + "in Promise") : null;
    trace ? log(1, ln, props) : null;

    getReg(props.iface, props.id, props.regName, (err, data) => {
      let trace = 0;
      // if (trace) {
      //   console.log(ln, "err=");
      //   console.dir(err);
      // }
      if (err) {
        if (trace) {
          log("i", ln, `err=`);
          console.dir(err);
        }
        reject(err);
        return;
      }
      if (trace) {
        console.log(ln, "data=");
        console.dir(data);
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
    "trp08.driver.setReg(id=" +
    id +
    ":regName=" +
    regName +
    ":value=" +
    value +
    "):";
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
      "Указанный регистр отсутствует в списке регистров устройства:" + regName;
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

/**
 * Повертає опис регістра у вигляді об'єкта: {name:імя регістра як в драйвері, description: this.title, units: this.units}
 * @param {String} [regName]  - опис регістра
 * @returns {Object}
 */

function getRegDescription(regName = null) {
  if (!regName) return null;
  if (!has(regName)) return null;
  let res = regs.get(regName);
  return {
    name: regName,
    header: res.header ? res.header : undefined,
    states: res.states ? res.states : undefined,
    description: res.title,
    units: res.units,
    type: res.type,
  };
}

module.exports.setReg = setReg;
module.exports.setRegPromise = setRegPromise;
module.exports.getReg = getReg;
module.exports.getRegPromise = getRegPromise;
module.exports.has = has;
module.exports.getRegDescription = getRegDescription;

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
    let reg = getRegDescription(key);
    log("i", "reg=", reg); //+ " -> "
  }
  // console.log("----------------------- \n regs = ");
  // console.dir(regs, { depth: 4 });
}
