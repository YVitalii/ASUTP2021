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
  let dOut = 0; // стан числового виходу 1 - замкнуто 0 - розімкнуто

  try {
    log("n=", await dev.setAI(2));
  } catch (error) {
    log("e", ln, error);
  }

  while (true) {
    //log("n=", await dev.getAI());

    // log("getAO()::result=", await dev.getAO());
    // log(`getAO(${i}); result=`, await dev.setAO(i));
    // log(`getDI(); result=`, await dev.getDI());
    // log(`getAO(${i}); result=`, await dev.setAO(i));
    dOut = Number(!dOut);
    log(`setDO(${Number(dOut)}); result=`, await dev.setDO(dOut));
    log(`getDO(); result=`, await dev.getDO());
    i += 10;
    if (i > 100) {
      i = 0;
    }
  }
})();
