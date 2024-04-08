let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const Manager = require("../manager.js");
let ln = "testCreateTrp.js::";
let id = 1;

let device1 = new Manager(iface, id, { addT: 5 });

module.exports = device1;

if (!module.parent) {
  log("i", ln, `device1=`);
  console.dir(device1);
}
