/**
 * модуль собирает все сущности, представленные в папке  entities и возвращает в виде массива объектов
 */

// ------------ логгер  --------------------
const log = require("../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;
const { readdirSync } = require("fs");
const server = require("../rs485/RS485_server.js");
/**
 * корневая папка с настройками печей
 */
let path = __dirname;
gTrace ? log("i", logName, "home dir=", path) : null;

/**
 * список печей
 */
let entities = [];

/**
 * регистрирует приборы из печи на сервере
 * @prop {Array} devices объект с настройками печи
 */
function regDevices(devices) {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "regDevices(" + "):";
  let trace = 0;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("i", logN, "Started") : null;
  //console.dir(devices[2]);
  // ------------------------------------------------------
  let regs = [];
  for (let i = 0; i < devices.length; i++) {
    let dev = devices[i];
    console.dir(dev);
    trace ? log("i", logN, "dev=", dev.addr) : null;
    server.addDevice(dev.addr, dev.type, dev.simulator);
    regs.push(regRegisters(dev.regs));
  }
  return regs;
}

/**
 * регистрирует регистры на сервере
 * @param {Array of Objects} registers
 * @returns {Array} возвращает массив регистров прибора
 */
function regRegisters(registers) {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "addRegisters(" + "):";
  let trace = 0;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("i", logN, "Started") : null;
  // ------------------------------------------------------
  let regs = [];
  //console.dir(registers);
  for (let i = 0; i < registers.length; i++) {
    let reg = registers[i];
    trace ? log("i", logN, "reg=", JSON.stringify(reg)) : null;
    server.addReg(reg);
    regs.push(reg);
  }
  return regs;
}

function getEntities() {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "работа:";
  let trace = 0;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("i", logN, "Started") : null;
  try {
    const files = readdirSync(path, { withFileTypes: 1 });
    for (const file of files) {
      if (file.isDirectory()) {
        trace ? log("i", logN, "Found folder:", file.name) : null;
        let conf = require(".\\" + file.name + "\\config.js");
        // проверяем есть, ли поле id в объекте, если есть принимаем объект, если нет - пропускаем
        if (conf.id) {
          if (!conf.devices) continue;
          if (!conf.devices[0].regs) continue;
          conf.regs = regDevices(conf.devices);
          entities.push(conf);
        }
      }
    } // for
    trace ? log("i", logN, "---------- Entities ---------") : null;
    trace ? console.dir(entities, { depth: 4 }) : null;
    return entities;
  } catch (err) {
    console.error(err);
  }
}

module.exports = getEntities();

if (!module.parent) {
  //console.dir(getEntities(), { depth: 6 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
