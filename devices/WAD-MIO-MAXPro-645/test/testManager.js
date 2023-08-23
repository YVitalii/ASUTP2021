const log = require("../../../tools/log.js"); // логер
let trace = 1,
  ln = "testManager.js::";

const Manager = require("../manager.js");
const iface = require("../../../rs485/RS485_v200.js");

const id = 72; // номер приладу

let dev = new Manager(iface, id);

if (trace) {
  log("i", ln, `dev=`);
  console.dir(dev);
}

(async () => {
  let i = 0;
  try {
    log("n=", await dev.setAI(2));
  } catch (error) {
    log("e", ln, error);
  }

  while (true) {
    //log("n=", await dev.getAI());
    log("n=", await dev.getAO());
    log("n=", await dev.setAO(i));
    i += 10;
  }
})();
