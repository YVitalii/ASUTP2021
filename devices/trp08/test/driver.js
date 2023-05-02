const iface = require("../../../rs485/RS485_v200.js");
// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

let id = 1;
const driver = require("../driver.js");
driver.getReg(iface, id, "state", (err, data) => {
  log("---> in getReg \n", data);
});
driver.setReg(iface, id, "state", 17, (err, data) => {
  log("---> in setReg \n", data);
});

driver.setReg(iface, id, "state", 1, (err, data) => {
  log("---> in setReg \n", data);
});

(async () => {
  let ln = "Promise::";
  let res = await driver.getRegPromise(iface, id, "tT");
  log("i", ln, " --------> get tT");
  console.dir(res);
  res = await driver.setRegPromise(iface, id, "tT", 170);
  log("i", ln, " --------> set tT");
  console.dir(res);
})();
