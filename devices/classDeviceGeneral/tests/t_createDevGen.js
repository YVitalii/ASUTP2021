const ClassDeviceManagerGeneral = require("../ClassDeviceManagerGeneral");
const iface = require("../../../conf_iface").w2;
const driver = require("../../trp08/driver");
let trace = 1,
  ln = __filename + "::";
let props = {
  id: "devManager",
  iface,
  addr: 1,
  driver,
  header: { ua: `testTRP08`, en: `testTRP08`, ru: `testTRP08` },
};

let devMan = new ClassDeviceManagerGeneral(props);

if (trace) {
  console.log(ln + `devMan=`);
  console.dir(devMan);
}

let test = async () => {
  await devMan.setRegister("tT", 80);
  console.log(ln + "test() finished");
};

test();
