// cd ./rs485
// supervisor --no-restart-on exit ./tests/DeviceEmulatorRegisterClass_test.js

const DeviceEmulatorRegisterClass = require("../DeviceEmulatorRegisterClass");
const GeneralRS485deviceEmulatorClass = require("../GeneralRS485deviceEmulatorClass");

const dev = new GeneralRS485deviceEmulatorClass({ id: "testRegister" });

let trace = 1,
  gLn = "DeviceEmulatorRegisterClass_test.js::";

dev.addReg(new DeviceEmulatorRegisterClass(dev, { addr: 1 }));

if (trace) {
  console.log(gLn + `dev=`);
  console.dir(dev, { depth: 1 });
}

trace ? console.log(gLn + `dev.getReg(1).value=${dev.getReg(1).value}`) : null;
