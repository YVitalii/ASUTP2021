const iface = require("../../../conf_iface.js").w2;
const log = require("../../../tools/log.js"); // логер
const Manager = require("../manager.js");
let ln = __filename + "::",
  trace = 1;
trace ? log("i", ln, `Started`) : null;
let device1 = new Manager({
  iface,
  addr: 71,
  id: "flowN2",
});
module.exports = device1;
if (!module.parent) {
  log("i", ln, `device1=`);
  console.dir(device1, { depth: 2 });
}
