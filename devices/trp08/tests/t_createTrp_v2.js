let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const Manager = require("../manager_v2.js");
let ln = __filename + "::";

let device1 = new Manager({ iface, addr: 2, id: "trp08_1", addT: 5 });

module.exports = device1;

if (!module.parent) {
  log("i", ln, `device1=`);
  console.dir(device1);
}
