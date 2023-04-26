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
------------ 2022-02-05 -----------------------------------
1. Удалил Aliases. Они работают только если у нас 1 печь, например 7SQ1, когда есть 3 печи с этими КВ
  то в алиасе нет смысла. Эту функциональность, вероятно, нужно перенести в настройку печи (entities) каждый менеджер пройцесса
  может делать себе ссылки в виде {"7SQ1" : "1-DIO3"} и работать с ними локально 
2. Добавил функцию addReg({}); которая регистрирует регистр на сервере. 
3. Добавил функцию addDevices("addr-name"); которая добавляет устройство в линию
*/

// ------------ логгер  --------------------
const log = require("../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
gTrace ? log("w", logName, "Started") : null;

/**
 * registers реестр используемых физических регистров  (названия как в драйвере)
 * здесь хранятся все данные о регистре, значение  и пр.
 * value, timestamp, buffer,note, err
 */
const registers = new Map();
const { isInteger } = require("../tools/general.js");
const { emulateRS485, priority } = require("../config.js");

/**
 * Допустимое количество повторов опроса, после которого считается что данных нет
 */
const ERRORS_COUNT = 5;

const iface = require("./RS485_v200.js"); // параметры порта в  config.js

/**
 * парсит имя регистра "1-tT" → [1,"tT"]
 * @param {String} name имя регистра в формате "address-registerName", например "1-tT"
 * @returns {Boolean | Array} false | [{integer} адрес, {String} имя]
 */
function parseName(name) {
  //  for example: name="1-T"
  let p = name.split("-");
  if (p.length != 2) {
    return false;
  }
  if (!isInteger(p[0])) {
    return false;
  }
  let answ = [parseInt(p[0], 10), p[1].trim()];
  //log("parseName: ",answ);
  return answ; //  ответ [адрес(int),имя(string)]
} //parse name

// список драйверов устройств
const deviceDrivers = new Map();
// широковещательный адрес, пока не используется.
deviceDrivers.set("all", undefined);

/**
 * загружает драйвер по адресу: /devices/${dev}/driver.js  для каждого типа устройства
 * и добавляет в deviceDrivers
 * @param {String} dev тип прибора, например "trp08"
 * @returns
 */
function loadDriver(dev) {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "loadDriver(" + dev + "):";
  let trace = 1;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("w", logN, "Started") : null;

  if (!dev) {
    log("e", "Устройство не указано");
    return false;
  }
  if (typeof dev != "string") return false;
  dev = dev.trim();
  // если драйвер уже загружен, успех, выходим
  if (deviceDrivers.has(dev)) return true;
  let msg = "Driver";
  // драйвер устройства еще не загружен, загружаем
  try {
    if (emulateRS485) {
      deviceDrivers.set(dev, require("../devices/" + dev + "/simulator.js"));
      msg = "Simulator";
    } else {
      deviceDrivers.set(dev, require("../devices/" + dev + "/driver.js"));
    }
    log("i", "Загружен " + msg + " драйвер для прибора:" + dev);
    return true;
  } catch (err) {
    log(0, "Ошибка загрузки модуля:" + dev + " => " + err.message);
    return false;
  }
} // loadDriver

/**
 * массив: индекс - адрес устройства, а значение - объект устройства,
 * таблица сопоставления адреса устройства , типа, а также отметка об активности прибора
 */
const devices = [];

/**
 * добавляет устройство таблицу устройств devices
 * @param {Integer} addr адресс в сети rs485
 * @param {String} type тип
 * @param {String} simulator=null симулятор прибора, используется при разработке
 * @returns
 */
function addDevice(addr, type, simOptions = null) {
  // ----------- настройки логгера локальные --------------
  let logN = logName + `addDevice(${addr},${type},${simOptions}):`;
  let trace = 1;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("w", logN, "Started") : null;

  if (typeof type != "string") {
    log("e", `Тип устройства должен быть строкой type=${type}`);
    return false;
  }
  type = type.trim();
  addr = parseInt(addr);
  if ((addr < 1) | (addr > 254)) {
    log("e", `Адрес прибора [${addr}] вне допустимого диапазона`);
    return false;
  }
  if (!loadDriver(type)) {
    log("e", `Невозможно загрузить драйвер прибора [${type}]`);
    return false;
  }
  if (devices[addr]) {
    log("e", `Прибор с таким адресом [${addr}] уже зарегистрирован`);
    return false;
  }
  let driver = deviceDrivers.get(type);
  if (emulateRS485) {
    driver = new driver(simOptions);
  }
  devices[addr] = {
    driver: driver, // драйвер устройства emulateRS485 ? simulator :
    active: true, // есть ли связь с прибором т.к. если часто опрашивать отсутствующий прибор,
    // то очень большие задержки на таймаутах
    tryReq: 0, // количество неотвеченных запросов с момента последнего опроса прибора
    lastReq: new Date(), // отметка времени последней попытки опроса тип Date()
  };
  trace ? log("w", logN, ` Devices[${addr}]=`, devices[addr]) : null;
  return true;
} //addDevice(addr, type)

/**
 * добавляет регистр в реестр
 * @param {Object} reg
 * @param {String} reg.id //  например "1-tT", обязательное поле адрес-имя, имя точно такое как в драйвере прибора
 * @param {Number} reg.priority // приоритет опроса прибора
 *
 */
function addReg(reg = {}) {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "addReg(reg):";
  let trace = 0;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("i", logN, "Started") : null;
  // -------
  let param = " reg=( " + JSON.stringify(reg) + " )"; // для вывода параметра ф-и в описании ошибки
  // ------ проверяем корректность полученных данных -----
  if (!reg.id) {
    log("e", logN, "Нет адреса регистра!" + param);
    return false;
  }
  let arr = parseName(reg.id); //парсим имя регистра
  if (!arr) {
    log("e", logN, "Не могу определить адрес и имя регистра:" + reg.id);
    return false;
  }
  let [addr, regName] = arr;
  if (!devices[addr]) {
    log("e", logN, "Указанного устройства не обнаружено." + param);
    return false;
  }
  // trace ? log("i", logN, "regName=", regName) : null;
  // trace ? log("i",logN,"devices[addr].driver.has(regName)=",devices[addr].driver.has(regName)): null;
  if (!devices[addr].driver.has(regName)) {
    log("e", logN, "Драйвер не опознал запрашиваемый регистр." + param);
    return false;
  }
  if (registers.has(reg.id)) {
    log("e", logN, "Запрашиваемый регистр уже зарегистрирован." + param);
    return false;
  }
  // --- все нормально, регистрируем ---------
  reg.priority = reg.priority ? reg.priority : priority.LOW;
  reg.value = null; // значение регистра
  reg.timestamp = new Date(); // время последнего опроса
  reg.errorsCounter = 0; // счетчик ошибок
  reg.err = null; // последняя ошибка
  reg.note = ""; // описание
  registers.set(reg.id, reg);
  trace
    ? log("w", logName, "---------- added reg='", reg.id, "' -------------")
    : null;
  trace ? console.dir(reg) : null;
  return true;
} //addReg(reg)

/**
 * Обновляет значение регистра в таблице регистров. Синхронная.
 * @param {String} regName пример:"1-T", регистр в формате "адрес-имя"
 * @param {Object} data обьект данных
 * @param {Date} data.timestamp отметка времени
 * @param {Date} data.note описание регистра, полученное от драйвера
 * @param {Date} data.req запрос в линию rs485
 * @param {Date} data.buf буфер ответа из линии rs485
 * @param {Date} data.value значение регистра
 * @param {Date} data.err описание ошибки, полученное от драйвера
 * @param {Date} data.err.message текстовое описание ошибки, полученное от драйвера
 * @param {Date} data.err.code код ошибки, полученное от драйвера
 * @returns {Boolean} результат операции обновления
 */
function saveRegister(regName, data) {
  // синхронная, обновляет данные в регистре regName, возвращает true после успешной операции
  let trace = 0;
  let head = "server_RS485: saveRegister(" + regName + "):";
  // проверяем имя регистра на наличие в реестре
  if (!registers.has(regName)) {
    // такого регистра в реестре нет
    log("e", head, "Неправильное имя регистра");
    //выходим
    return false;
  }
  // получаем данные из реестра
  let regData = registers.get(regName);
  trace
    ? log(1, head, "incoming data=", data, "\n \t before regData=", regData)
    : null;
  // обновляем отметку времени
  regData.timestamp = data.timestamp;
  //обновляем описание регистра
  regData.note = data.note;

  if (data.err) {
    //если в данных ошибка
    regData.errorsCounter += 1; // увеличиваем счетчик ошибок
    regData.err = {};
    regData.err.message = data.err.message;
    regData.err.code = data.err.code;
    regData.err.req = data.req; // сохраняем запрос
    regData.err.buf = data.buf; // сохраняем буфер ответа
    if (regData.errorsCounter > ERRORS_COUNT) {
      // если больше 5 ошибок
      regData.value = null; // пишем: значение не определено
      regData.errorsCounter = ERRORS_COUNT; // останавливаем счетчик
    }
  }
  if (!data.err) {
    // ошибок нет
    regData.value = data.value; // записываем полученное новое значение
    regData.errorsCounter > 0 ? (regData.errorsCounter -= 1) : 0; //при необх.уменьшаем счетчик ошибок
    regData.err = null;
  }
  trace ? log(1, head, "\n\t after regData=", regData) : null;
  registers.set(regName, regData); // пишем в таблицу регистров
  return true;
}

function getRegName(name) {
  // находит имя регистра по алиасу или имени и возвращает его
  // если не нашла null
  let reg = null; // имя регистра
  name = name.trim();
  // if (aliases.has(name)) {
  //   reg = aliases.get(name);
  // }
  if (registers.has(name)) {
    reg = name;
  }
  return reg;
} //function getReg

/**
 * считывает значение регистра по RS-485 и заносит ответ в registers
 * @param {*} name имя регистра в формате "адресс-имя"
 * @param {requestCallback} cb коллбэк
 */
function read(name, cb) {
  // настройки логгера
  let trace = 0;
  let head = "server_RS485:read(" + name + "):";
  // нормализуем имя регистра
  let reg = getRegName(name);
  if (reg) {
    // регистр найден в реестре
    // парсим имя
    let [adr, regName] = parseName(reg);
    if (!adr | !regName) {
      return cb(new Error("Немогу распарсить имя регистра: " + reg));
    }
    // получаем драйвер
    let device = devices[adr].driver;

    if (config.emulateRS485) {
      // если режим эмуляции
      let data = emulator(adr, regName);
      parseData(data, null);
      return cb(null, registers.get(reg));
    }
    // считываем данные по RS485
    device.getReg(iface, adr, regName, (err, data) => {
      if (err) {
        // сообщаем об ошибке
        log(0, head, "Error: code=", err.code, "; message= ", err.message);
      }
      //trace ? log(2,head,"Received data=",data) : null;
      trace ? console.dir(data) : null;
      parseData(data, err);
      // выходим
      return cb(err, registers.get(reg));
    }); //getReg
  } else {
    // регистра с таким именем не обнаружено в реестре
    return cb(new Error("Регистра: " + name + " не обнаружено"), null);
  } //else
} //function read

// // ------------ эмулирует получение температуры по RS485 -----
// const start = new Date().getTime(); //запоминаем время первого запуска - єто будет 0
// function emulator(addr, name) {
//   let trace = 0;
//   let furnace = config.entities[0]; // выбираем первую печь в списке
//   // функция отвечает на запросы эмулируя физические величины
//   let max = furnace.temperature.max; //максимальная температура
//   let min = furnace.temperature.min; //минимальная температрура
//   let period = 3 * 60 * 1000 * addr; //длительность периода колебаний (3 минут * addr)
//   let x = (new Date().getTime() - start) / period; // текущий х
//   let y = (Math.sin(x) * (max - min)) / 2 + (max - min) / 2;
//   y = Math.round(y);
//   let res = [];
//   res.push({
//     regName: name,
//     value: y,
//     req: {
//       FC: 3,
//       addr: 05,
//       data: 1,
//       timeout: 2000,
//       id: addr,
//     },
//     timestamp: new Date(),
//     buf: new Buffer([0, 37]),
//     note: "Текущая температура",
//   }); //push
//   trace ? console.log("emulator(" + addr + "," + name + ")=") : null;
//   trace ? console.dir(res) : null;
//   return res;
// }

function parseData(data, err) {
  let trace = 0;
  let head = "RS485_server:parseData():";
  //обрабатываем принятые данные
  // т.к. при ошибке может возвращаться одиночный объект, то проверяем на массив
  if (Array.isArray(data)) {
    // для каждого элемента в массиве ответов
    for (var i = 0; i < data.length; i++) {
      // получаем имя регистра. т.к. оно может не совпадать с запросом, например при чтении группы регистров
      let item = data[i];
      let name = "" + item.req.id + "-" + item.regName;
      if (err) {
        item["err"] = { code: err.code, message: err.message };
        // если была ошибка, вписываем ее в данные
      }
      // записываем в реестр принятые данные
      if (registers.has(name)) {
        trace ? log("i", head, "записываем ", name, "=", item) : null;
        saveRegister(name, item);
      } else {
        log(
          "e",
          head,
          "Регистр: " + name + " не обнаружен в реестре. Пропускаем."
        );
      }
    } //for
  }
} //function parseData(data)

/**
 * записывает значение регистра  по RS-485 и заносит ответ в registers
 * @param {String} args принимает одно значение в формате "regName=value"
 * @param {*} cb (err,data) , где data - ответ драйвера прибора
 * @returns callback  возвращает (err,data)
 */
function write(args, cb) {
  let trace = 0;
  let head = "server_RS485:write(" + args + "):";
  // парсим аргументы
  let [name, value] = args.split("=");
  // парсим имя
  let reg = getRegName(name);
  if (reg) {
    // регистр найден в реестре
    // парсим имя
    let [adr, regName] = parseName(reg);
    if (!adr | !regName) {
      return cb(new Error("Немогу распарсить имя регистра: " + reg));
    }
    // получаем драйвер
    let device = devices[adr].driver;
    // записываем данные по RS485
    device.setReg(iface, adr, regName, value, (err, data) => {
      if (err) {
        log("e", err.code, "->", err.message);
        data["err"] = err;
      }
      trace ? log("i", head, "data=", data) : null;
      saveRegister(reg, data);
      return cb(err, data);
    });
  }
}

/**
 * синхронная, возвращает из таблицы регистров данные регистра name
 * @param {String} name имя регистра
 * @returns null | значение регистра
 */
function get(name) {
  //
  // синхронная
  let regName = getRegName(name);
  let head = "server_RS485:get(" + name + "):";
  if (!registers.has(regName)) {
    log("e", head, "Неправильное имя регистра:" + name);
    return null;
  }
  return registers.get(regName);
}

module.exports.get = get; //синхронная
module.exports.read = read;
module.exports.write = write;
module.exports.has = getRegName;
module.exports.addReg = addReg; //синхронная
module.exports.addDevice = addDevice; //синхронная

if (!module.parent) {
  //addReg({});
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
  // function testRead() {
  //   let t = "1-T";
  //   read(t, (err, data) => {
  //     let logN = logName + " callback read(";
  //     if (err) {
  //       log("e", logN, t, "): error=");
  //       return;
  //     }
  //     //console.log(err);
  //     log("i", logN, t, ") data=");
  //     console.log(data);
  //   });
  //   t = "2-T";
  //   read(t, (err, data) => {
  //     let logN = logName + " callback read(";
  //     if (err) {
  //       log("e", logN, t, "): error=");
  //       return;
  //     }
  //     //console.log(err);
  //     log("i", logN, t, ") data=");
  //     console.log(data);
  //   });
  // }
  // setInterval(testRead, 3000);
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
