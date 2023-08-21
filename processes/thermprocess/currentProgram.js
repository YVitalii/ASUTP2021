const fs = require("fs");
const log = require("../../tools/log.js");
let lN = "currentProgram.js::";

function load(fileName) {
  let res = null;
  let ln = lN + "load()::",
    trace = true;
  if (!fs.existsSync(fileName)) {
    // перевіряємо наявність файлу з поточною програмою
    log("i", ln, `File with current program: "${fileName}" not found!`);
    return res;
  }
  try {
    res = fs.readFileSync(fileName, "utf8");

    res = JSON.parse(res);
    log(
      "i",
      ln,
      `Current program: "${fileName}" with title:"${res[0].title}" was loaded`
    );
  } catch (e) {
    log("e", ln, `Error loading program : "${fileName}`, e);
    return null;
  }
}

function save(fileName, arr) {
  let res = null;
  let ln = lN + "save()::",
    trace = true;
  try {
    res = JSON.stringify(arr);
    trace ? log("n", ln, `parsed`) : null;
    res = fs.writeFileSync(fileName, res, "utf8");
    trace ? log("n", ln, fileName, ` Saved `) : null;
    log(
      "i",
      ln,
      `Current program: "${fileName}" with title:"${arr[0].title}" was saved.`
    );
  } catch (e) {
    log("e", ln, e);
    return null;
  }
}

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let program = require("./tests/testProgram.js");
  log("n", program);
  let fileName = __dirname + "/currProgram.txt";
  save(fileName, program);
  load(fileName);
}
