/**
 * Клас виконує керування файлами
 * працює на сервері
 */
// TODO Написати автотести для цього модуля
const log = require("../../tools/log");
const fs = require("fs");
const fsPromises = require("fs/promises");
const pathResolve = require("path").resolve;
const pathJoin = require("path").join;
const pathNormalize = require("path").normalize;
const ClassRegister = require("../regsController/ClassRegister");

class ClassFileManager {
  /**
   * Робота з локальними файлами
   * @param {Object} props
   * @property {String} props.homeDir - домашня директорія
   * @property {String} props.homeURL - URL по якому буде відповідати менеджер
   * (схоже що потр. реалізувати в іншому місці)
   * хоча ми використовуємо його для побудови маршрутів,
   * але достатньо памятати тільки кінець маршруту типу:
   * /deleteFile .. /readFile()
   * @property {String} props.ln - заголовок повідомлення для логу
   */
  constructor(props = {}) {
    // TODO Видалити з файлового менеджера homeURL - він має приходити зовні з роутерів
    if (!props.homeDir) {
      throw new Error("ClassFileManager:: Error! Not defined home directory!");
    }
    this.homeDir = pathNormalize(pathResolve(props.homeDir));

    this.ln = (props.ln ? props.ln : "") + `ClassFileManager::`;

    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("", ln, `props=`);
      console.dir(props);
    }

    // URL адреса на яку надсилаються запити, якщо не вказана - то коренева
    this.homeURL = props.homeURL
      ? props.homeURL
      : props.homeUrl
      ? props.homeUrl
      : "/";

    // перевіряємо наявність вказаної директорії
    if (!fs.existsSync(this.homeDir)) {
      // директорія не існує, намагаємось створити її
      try {
        fs.mkdirSync(this.homeDir);
      } catch (error) {
        throw error;
      }
      // директорію створено
    }
    //** Список файлів */
    this.filesList = [];
    this.readFileList();
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
    // trace
    //   ? log("i", ln, `this.filesList=`, JSON.stringify(this.filesList))
    // : null;
  } //constructor

  //** синхронна, Фізично считує вміст директорії */
  readFileList() {
    this.filesList = fs.readdirSync(this.homeDir);
    return this.filesList;
  }
  /**
   * Обрізає лог-файл починаючи зі startDate
   * @param {String} fileName
   * @param {Number} startDate=(now - 24*60*60*1000) - milisec
   * @returns true/false
   */
  async truncateFileBeforeDate(fileName, startDate) {
    let trace = 0,
      ln = this.ln + `truncateFileBeforeDate(${fileName})::`;
    startDate = startDate ? startDate : Date.now() - 24 * 60 * 60 * 1000;
    trace
      ? log("i", ln, `startDate=`, new Date(startDate).toLocaleString())
      : null;
    let data = "";
    try {
      data = await this.readFile(fileName);
      trace ? log("i", ln, `data=`, data) : null;
    } catch (error) {
      log("e", ln);
      console.error(error);
    }

    let arr = data.split("\n");
    data = arr[0] + "\n";
    if (trace) {
      log("i", ln, `data=${data} arr=`);
      console.dir(arr);
    }

    arr.slice(1, arr.length).map((item) => {
      trace ? log("i", ln, `item=`, item) : null;
      try {
        let date = item.split("\t")[0];
        date = new Date(date).getTime();
        if (date == "Invalid Date") {
          return;
        }
        if (date > startDate) {
          data += item + "\n";
        }
      } catch (error) {}
    });
    await this.writeFile(fileName, data);
    return true;
  }

  //** синхронна, повертає збережений в памяті список */
  getFilesList() {
    return this.filesList;
  }

  async readFile(fName) {
    let trace = 1,
      ln = this.ln + `readFile(${fName})::`;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    let path = pathJoin(this.homeDir, fName);
    try {
      let data = await fsPromises.readFile(path);
      log("w", ln + "File was readed.");
      return data.toString();
    } catch (error) {
      log("e", ln + "Can't read file:" + path);
      throw new Error(error);
    }
  }

  readFileSync(fName) {
    let trace = 0,
      ln = this.ln + `readFileSync(${fName})::`;
    trace ? log("i", ln, `Started fName=`, fName) : null;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    let path = pathJoin(this.homeDir, fName);
    let data = fs.readFileSync(path);
    log("w", ln + "File was readed.");
    if (trace) {
      log("i", ln, `data=`);
      console.dir(data);
    }
    return data.toString();
  }

  async deleteFile(fName) {
    let trace = 1,
      ln = this.ln + `deleteFile(${fName})::`;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    await fsPromises.unlink(pathJoin(this.homeDir, fName));
    this.readFileList();
    log("w", ln + "File deleted.");
    return;
  }

  async writeFile(fName, data) {
    let trace = 0,
      ln = this.ln + `writeFile(${fName})::`;
    trace ? log("i", ln, `data=`, data) : null;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    if (data == undefined || data == "") {
      return Promise.reject(ln + "Data not defined!");
    }
    if (typeof data != "string") {
      data = JSON.stringify(data);
    }

    let res = await fsPromises.writeFile(pathJoin(this.homeDir, fName), data);
    this.readFileList();
    log("w", ln + "File created.");
    //return res;
  }

  async getFileStats(fName) {
    // якщо імя файлу не вказано, беремо поточний файл
    fName = fName ? fName : this.fName;
    // логер
    let trace = 1,
      ln = this.ln + `getFileStats(${fName})::`;
    // перевіряємо існування вказаного файлу
    if (!this.exist(fName)) {
      throw new Error(ln + `File not exist!`);
    }
    // робимо запит
    return fsPromises.stat(pathJoin(this.homeDir, fName));
  }

  async appendFile(fName, data) {
    let trace = 1,
      ln = this.ln + `addToFile(${fName})::`;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    if (data == undefined || data == "") {
      return Promise.reject("Data not defined!");
    }
    await fsPromises.appendFile(pathJoin(this.homeDir, fName), data);
  }

  /** повертає true якщо файл з ім'ям fName існує */
  exist(fName) {
    let trace = 1,
      ln = this.ln + `exist(${fName})::`;
    let res = false;
    for (let i = 0; i < this.filesList.length; i++) {
      if (this.filesList[i] === fName) {
        return true;
        break;
      }
    }
    return res;
  }
} //class ClassFileManager

module.exports = ClassFileManager;
