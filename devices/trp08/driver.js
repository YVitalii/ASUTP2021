const { emulateDevices } = require("../../config");
const driver = require("./makeNewDriverFromOld.js");
// Підключаємо відповідний драйвер в залежності від режиму емуляції

if (emulateDevices) {
  // модифікуємо драйвер, щоб він імітував роботу печі
  require("./trp08_fakeDriver")(driver);
}
let trace = 0,
  ln = __filename + "::";
if (trace) {
  console.log(ln + `driver=`);
  console.dir(driver);
}
module.exports = driver;
