const fs = require("fs");
const log = require("./log.js");
let lN = "currentProgram.js::";

function load(fileName) {
  let res = null;
  let ln = lN + "load()::",
    trace = true;
  if (!fs.existsSync(fileName)) {
    // перевіряємо наявність файлу з поточною програмою
    log("i", ln, `File: "${fileName}" not found!`);
    return res;
  }
  try {
    res = fs.readFileSync(fileName, "utf8");

    res = JSON.parse(res);
    log("i", ln, `File: "${fileName}"  was loaded`);
    return res;
  } catch (e) {
    log("e", ln, `Error loading program : "${fileName}`, e);
    return null;
  }
}

function save(fileName, arr) {
  let res = null;
  let ln = lN + "save()::",
    trace = true;
  trace ? log("n", ln, `fileName=`, fileName) : null;
  try {
    res = JSON.stringify(arr);
    trace ? log("n", ln, `parsed res=`, res) : null;
    res = fs.writeFileSync(fileName, res, "utf8");
    trace ? log("n", ln, fileName, ` Saved `) : null;
    log("i", ln, `File: "${fileName}" was saved.`);
  } catch (e) {
    log("e", ln, e);
    return null;
  }
}

function del(fileName, arr) {
  let ln = lN + "del()::",
    trace = true;
  trace ? log("n", ln, `fileName=`, fileName) : null;
  try {
    res = fs.unlinkSync(fileName);
    trace ? log("n", ln, fileName, ` Deleted `) : null;
  } catch (e) {
    log("e", ln, e);
    return null;
  }
}

module.exports.load = load;
module.exports.save = save;
module.exports.del = del;

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let program = require("./tests/testProgram.js");
  log("n ", program);
  let fileName = __dirname + "/currProgram.txt";
  save(fileName, program);
  load(fileName);
}
