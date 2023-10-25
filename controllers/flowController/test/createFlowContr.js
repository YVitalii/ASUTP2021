const Device = require("../../../devices/WAD-MIO-MAXPro-645/manager");
const iface = require("../../../conf_iface");
const FlowController = require("../classFlowController.js");
const save = require("fs").writeFile;
let homeDir = require("path").normalize(__dirname + "/index.html");
const log = require("../../../tools/log");
let trace = 1,
  ln = "flowController/test/createFlowControler::";

const dev = new Device(iface.w2, 71);
let value = 0;
let props = {};
props.id = "N2";
props.shortName = "Ammonia";
props.fullName = "Азот";
props.flowScale = { min: 0, max: 3 }; //m3
props.getDevicePV = async () => {
  return await dev.getAI();
};
props.setDeviceSP = async (val) => {
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
      console.log(ln + "File " + homeDir + " written successfully");
    }
  }
);

//save();

module.exports = fc;

async function next() {
  try {
    //value += 10;

    log("i", ln, "getSP() = ", await fc.getSP());
    log("i", ln, "current PV = ", await fc.getPV());
    log("i", ln, "current flow = ", await fc.getCurrentFlow());
    console.log("--------------------------------");
  } catch (error) {
    log("e", error);
  }

  setTimeout(() => {
    next();
  }, 1000);
}

setInterval(async () => {
  value = value >= 100 ? 0 : value + 10;

  await fc.setSP(value);
  log("w", ln, "setSP (", value, ")");
}, 60000);

if (!module.parent) {
  setTimeout(() => {
    next();
  }, 3000);
}
