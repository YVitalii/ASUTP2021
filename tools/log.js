// ------------ логгер  --------------------
// const l = require('../tools/log.js'); // логер
// let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
// let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;
const fs = require("fs");
const path = require("path");
const { ifError } = require("assert");
var buf = require("./parseBuf.js");
var colors = require("colors");
let homeDir = path.normalize(__dirname + "/events/");
let fileName = path.join(homeDir, "eventsLog.txt");
let oldFileName = path.join(homeDir, "oldEventsLog.txt");
//fileName = path.normalize(fileName);

//var modulName=null;
let fd = null; // дескриптор файлу

(() => {
  try {
    // перевіряємо наявність директорії
    if (!fs.existsSync(homeDir)) {
      // немає → створюємо
      fs.mkdirSync(homeDir);
    }
    // якщо файл існує
    if (fs.existsSync(fileName)) {
      //- отримуємо його розмір
      let stats = fs.statSync(fileName);
      //перевіряємо розмір файла 200к
      if (stats.size > 200 * 1064) {
        // файл завеликий
        if (fs.existsSync(oldFileName)) {
          // якщо застарівший файл існує -видаляємо його
          fs.unlinkSync(oldFileName);
        }
        // перейменовуємо поточний файл в застарівший
        fs.renameSync(fileName, oldFileName);
      }
    }
    // створюємо/відкриваємо файл для запису
    fd = fs.openSync(fileName, "a+");
    log("n", `log.js::File for logging process events opened: ${fileName} `);
  } catch (error) {
    throw error;
  }
})();

function setFH(fh) {
  FH = fh;
}
function write(line, FH) {
  let res = "";
  if (FH) {
    let now = new Date().toLocaleString().slice(-8);
    res = now + "\t" + line + "\n";
    fs.write(FH, res, (err) => {
      if (err) {
        console.log("ERR:<log.js>: Can`t write to file" + err.message);
      }
    });
  }
  return res;
} //print

/**
 * Это описание функции log()
 * @param {string | number} level - 0="e"=error; 1="w"-warning; 2="i" - info
 */

function log(level = 3, fh) {
  let startPoint = 1;
  let type = "",
    item,
    line = "";
  let color = "";
  level = parseInt(arguments[0]);
  if (!level) {
    level = arguments[0];
  }

  switch (level) {
    case 0:
    case "e":
    case "err":
      level = 0;
      line = "ERR ";
      color = "red";
      break;
    case 1:
    case "w":
    case "warn":
      level = 1;
      line = "WARN";
      color = "yellow";
      break;
    case 2:
    case "i":
    case "info":
      level = 2;
      line = "INFO";
      color = "green";
      break;
    default:
      level = 3;
      line = "NOTE";
      color = "grey";
      startPoint = 0;
  }

  //console.log("level="+level+"; startPoint=",startPoint);
  line += ": "; //": <"+ modulName+">: ";
  for (let i = startPoint; i < arguments.length; i++) {
    item = arguments[i];
    type = typeof item;
    switch (type) {
      case "string":
        line += item;
        break;
      case "number":
        line += item;
        break;
      case "object":
        if (Buffer.isBuffer(item)) {
          line += buf(item);
          break;
        }
        line += JSON.stringify(item) + " ";
        break;
      case "boolean":
        line += item ? "true" : "false";
    }
  } //for
  // друкуємо в консоль
  console.log(line[color]);
  // перевіряємо рівень повідомлення
  if (level < 3) {
    write(line, fd);
  }
  return;
} //log

module.exports = log;

// module.exports.setName = setName;
module.exports.setFH = setFH;

if (!module.parent) {
  fs.open("./log.txt", "a+", (err, fd) => {
    if (err) throw err;

    //setName("Log.js");
    setFH(fd);
    log(0, "I=", { dir: 2, item: "some" }, "kg,B=", true);
    log(1, "I=", new Buffer("1234"), "B=", 17, "inch");
    let i = 90;
    log(2, "I=", [5, 6, 7], "B=", i, "inch");
    log("e", "I=", [5, 6, 7], "B=", i, "inch");
    log("w", "I=", [5, 6, 7], "B=", i, "inch");
    log("i", "I=", [5, 6, 7], "B=", i, "inch");
    log("I=", [5, 6, 7], "B=", i, "inch");
    log("buf=", new Buffer("123456"));
    log("----------------------------------------------------");
    console.log("Return:", log("w", "I=", [5, 6, 7], "B=", i, "inch"));
  });
}
