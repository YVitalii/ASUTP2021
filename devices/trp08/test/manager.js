const iface = require("../../../rs485/RS485_v200.js");
// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const Manager = require("../manager.js");

let id = 1;

async function test() {
  let device1 = new Manager(iface, id, { addT: 5 });
}

setTimeout(test, 5000);

(async () => {
  //   let ln = "Promise::";
  //   let res = await driver.getRegPromise(iface, id, "tT");
  //   log("i", ln, " --------> get tT");
  //   console.dir(res);
  //   res = await driver.setRegPromise(iface, id, "tT", 170);
  //   log("i", ln, " --------> set tT");
  //   console.dir(res);
})();
