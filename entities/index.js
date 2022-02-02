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

let path = __dirname;
//log("i", logName, "path=", path);

let entities = [];

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

// if (!module.parent) {
//   console.dir(getEntities(), { depth: 4 });
//   //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
//   //util.inspect(config)
// }
