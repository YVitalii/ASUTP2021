const config = require("../config.js");
const tools = require("./logTools.js");
const fs = require("fs");
// ------------ логгер  --------------------
let log = require("../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
gTrace ? log("i", logName) : null;

//const dirent = require('dirent');
const getDate = require("../tools/general.js").getDateString;

class LogWriter {
  /**
   *
   * @param {Object} options
   * @param {Object} options.server - об'єкт до якого будуть отримуватися поточні значення регістрів
   * @param {String} options.listRegs - список регістрів для запису розділених крапкою з комою "1-tT;1-T..."
   * @param {String} options.path = (config.js).logger.path - абс. шлях до теки зберігання лог-файлів, якщо не вказано - береться з config.js
   */
  constructor(options) {
    this.ln = `LogWriter(${options.listRegs}).`; // для напису в логи консолі
    var trace = 0,
      logN = this.ln + "constructor(): ";
    trace ? log("i", logN, "Enter.") : null;

    // --------- сервер ----------------------------
    if (!options.server) {
      let err = "options.server=" + options.server;
      log("e", logN, err);
      throw new Error(err);
    }
    this.server = options.server;
    // ----------   список регистров ----------
    if (!options.listRegs) {
      let err = "options.listRegs=" + options.listRegs;
      console.error(err);
      throw new Error(err);
    }
    this.listRegs = options.listRegs;
    this.regsArray = this.listRegs.split(";");
    this.headers =
      "time\t" + this.listRegs.replace(/;/g, config.logger.separator) + "\r\n"; //строка для записи в файл
    trace ? log("i", logN, "this.listRegs=", this.listRegs) : null;
    trace ? log("i", logN, "this.regsArray=", this.regsArray) : null;
    trace ? log("i", logN, "this.headers=", this.headers) : null;
    // --------  запись предыдущих значений (для определения простоя печи и остановки записи в лог)
    this.beforeValues = null;

    // --------  путь к файлу  ---------------------
    if (!options.path) {
      // путь не указан
      let warn = "options.path=" + options.path;
      options.path = config.logger.path;
      warn += "; используем путь из конфиг файла: " + options.path;
      console.warn(err);
    }
    this.path = options.path;
    this.fName = this.path + "/" + getDate() + ".log";
    trace ? console.info(logN, "this.path=", this.path) : null;
    // ---- проверяем наличие файла лога и если нужно создаем его ----------
    testDirectory(this.path)
      .then((response) => {
        // директория создана
        trace ? console.info(logN, "this.path=", this.path) : null;
        return this.fName;
      })
      .then((fName) => {
        // создаем/проверяем наличие файла
        trace ? console.info(logN, "this.fName=", fName) : null;
        return tools.testFile(fName, this.headers);
      })
      .then(
        // запускаем таймер опроса регистров
        (fName) => {
          //console.log("setInterval");
          setInterval(iterate.bind(this), config.logger.period * 1000);
        }
      )
      .catch((err) => {
        log("e", logN, err);
      });
  } //constructor
} //class Chart

module.exports = LogWriter;

/**
 * Перетворює вхідний детальний об'єкт { '1-tT': {value: 300, timestamp...},..}
 * в об'єкт виду { '1-tT': { value: -5 }, '1-T': { value: -5 } }
 * якщо в нас на вході null, то він замінюється на -5
 * @param {Object} values
 * @returns
 */
function modifyValues(values) {
  let trace = 0,
    ln = this.ln + "modifyValues()::";
  if (trace) {
    log("i", ln, `values=`);
    console.dir(values);
  }
  let newValues = {};
  for (each in values) {
    newValues[each] = { value: values[each].value };
    //log("i",values[each]);
    if (values[each].value === null) {
      // если считанное значение = null
      newValues[each].value = -5;
    }
  } //  for (each in values)
  if (trace) {
    log("i", ln, `newValues=`);
    console.dir(newValues);
  }
  return newValues;
}

function iterate() {
  // -- настройки логгера --------------
  let trace = 1;
  let logN = this.ln + "iterate() => ";
  //-----------------------------------------
  let values = this.server.getValues(this.listRegs);
  values = modifyValues(values);
  if (!this.beforeValues) {
    // попередніх значень - немає, отже перша ітерація
    // створюємо нульову точку
    this.beforeValues = {};
    for (each in values) {
      this.beforeValues[each] = { value: 0 };
    }
    //this.beforeValues = values;
    trace
      ? log("i", logN, "First time: beforeValues=", this.beforeValues)
      : null;
    return;
  }
  //trace ? log("i", logN, `values=`, values) : null;
  // Проверка изменилось ли хоть одно значение больше чем на 'deviation' из config.js:
  var valuesDidNotChange = true;
  for (key in values) {
    //console.log([this.beforeValues[key], values[key], config.logger.deviation]);
    if (
      Math.abs(this.beforeValues[key].value - values[key].value) >
      config.logger.deviation
    ) {
      valuesDidNotChange = false;
    }
  }
  // console.log(valuesDidNotChange);
  // Если значения не менялись - выход из функции:
  if (valuesDidNotChange) return;
  // значення змінилось
  //запамятовуємо поточні значення , як попередні
  this.beforeValues = values;
  // створюємо рядок для запису
  let sep = config.logger.separator;
  //console.log(values);
  let line = new Date().toJSON();
  for (var i = 0; i < this.regsArray.length; i++) {
    line += sep + values[this.regsArray[i]].value;
  }
  line += "\r\n";

  // записуємо в файл
  tools.writeLine(this.fName, line, (err) => {
    if (err) {
      log("e", logN, "writeLine error:", err);
      throw err;
    }
    trace ? log("i", logN, "Saved to file: ", line.slice(0, -1)) : null;
  });
}

function testDirectory(path) {
  // проверяет наличие директории и если нужно создает ее
  return new Promise((resolve, reject) => {
    console.log("testDirectory(" + path + ")");
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  }); //Promise
} //testDirectory
