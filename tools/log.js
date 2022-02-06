// ------------ логгер  --------------------
// const log = require('../tools/log.js'); // логер
// let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
// let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;
// trace ? log("i",logN,"--- ---") : null;
// trace ? console.dir() : null;

var buf = require("./parseBuf.js");
var colors = require("colors");

const fs = require("fs");
var modulName;
var FH;

function setName(str) {
  modulName = ""; //str;
}
function setFH(fh) {
  FH = fh;
}

function print(line, color) {
  console.log(line[color]);
  if (FH) {
    let now = new Date().toISOString();
    fs.write(FH, now + "::" + line + "\n", (err) => {
      if (err) {
        console.log("ERR:<log.js>: Can`t write to file" + err.message);
      }
    });
  }
} //print

/**
 * Это описание функции log()
 * @param {string | number} level - 0="e"=error; 1="w"-warning; 2="i" - info
 */

function log(level = 3) {
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
      line = "ERR ";
      color = "red";
      break;
    case 1:
    case "w":
    case "warn":
      line = "WARN";
      color = "yellow";
      break;
    case 2:
    case "i":
    case "info":
      line = "INFO";
      color = "green";
      break;
    default:
      line = "INFO";
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

  print(line, color);
} //log

module.exports = log;

module.exports.setName = setName;
module.exports.setFH = setFH;

if (!module.parent) {
  fs.open("./log.txt", "a+", (err, fd) => {
    if (err) throw err;

    setName("Log.js");
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
  });
}
