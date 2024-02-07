/**
 * Клас виконує керування файлами
 *
 */
const log = require("../../tools/log");
const fs = require("fs");
const fsPromises = require("fs/promises");
const pathResolve = require("path").resolve;
const pathJoin = require("path").join;
const pathNormalize = require("path").normalize;
const ClassRegister = require("../regsController/ClassRegister");

class ClassFileManager {
  constructor(props = {}) {
    if (!props.homeDir) {
      throw new Error("ClassFileManager:: Error! Not defined home directory!");
    }
    this.homeDir = pathNormalize(pathResolve(props.homeDir));
    this.ln = (props.ln ? props.ln : "") + `ClassFileManager::`;

    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("", ln, `props=`);
      console.dir(props);
    }

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
    trace
      ? log("i", ln, `this.filesList=`, JSON.stringify(this.filesList))
      : null;
  } //constructor

  //** синхронна, Фізично считує вміст директорії */
  readFileList() {
    this.filesList = fs.readdirSync(this.homeDir);
    return this.filesList;
  }
  //** синхронна, повертає збережений в памяті список */
  getFileList() {
    return this.filesList;
  }

  async readFile(fName) {
    let trace = 1,
      ln = this.ln + `readFile(${fName})::`;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    let data = await fsPromises.readFile(pathJoin(this.homeDir, fName));
    log("w", ln + "File was readed.");
    return data;
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
    let trace = 1,
      ln = this.ln + `writeFile(${fName})::`;
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

  async appendFile(fName, data) {
    let trace = 1,
      ln = this.ln + `addToFile(${fName})::`;
    if (fName == undefined) {
      return Promise.reject(ln + "File name not defined!");
    }
    if (data == undefined || data == "") {
      return Promise.reject("Data not defined!");
    }
    fsPromises.appendFile(pathJoin(this.homeDir, fName), data);
  }
  /** повертає вірно якщо файл з ім'ям fName існує */
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
