const driver = require("./makeNewDriverFromOld.js");

let trace = 0,
  ln = __filename + "::";

if (trace) {
  console.log(ln + `driver=`);
  console.dir(driver);
}

module.exports = driver;
