const Device = require("../../../devices/WAD-MIO-MAXPro-645/manager");
const iface = require("../../../rs485/RS485_v200");
const FlowController = require("../classFlowController.js");
const save = require("fs").writeFile;
let homeDir = require("path").normalize(__dirname + "/index.html");
const log = require("../../../tools/log");
let trace = 1,
  ln = "flowController/test/createFlowControler::";

const dev = new Device(iface, 73);
let value = 0;
let props = {};
props.id = "NH3_sm";
props.shortName = "NH3_low";
props.fullName = "Аміак. Малий потік";
props.flowScale = { min: 0, high: 1.1 }; //m3
props.getValue = async () => {
  return await dev.getAI();
};
props.setValue = async (val) => {
  return await dev.setAO(val);
};

props.periodSets = { working: 1, waiting: 2, stabilization: 10 };

const fc = new FlowController(props);

if (trace) {
  log("i", ln, `fc=`);
  console.dir(fc);
}

save(
  homeDir,
  fc.getHtml(),
  {
    encoding: "utf8",
    flag: "w",
  },
  (err) => {
    if (err) console.log(err);
    else {
      console.log("File " + homeDir + " written successfully");
    }
  }
);

module.exports = fc;

async function next() {
  value = value > 100 ? 0 : value;
  try {
    await fc.setTarget(value);
    value += 10;
    log("i", ln, "current flow = ", fc.getCurrentFlow());
  } catch (error) {
    log("e", error);
  }

  setTimeout(() => {
    next, 20000;
  });
}

if (!module.parent) {
  setTimeout(() => {
    next();
  }, 3000);
}
