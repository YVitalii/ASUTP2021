// browser-sync start --server --browser "Chrome" --files "stylesheets/*.css, *.html"

const Device = require("../../../devices/WAD-MIO-MAXPro-645/manager");
const iface = require("../../../conf_iface");
const FlowController = require("../classFlowController.js");
const save = require("fs").writeFile;
let homeDir = require("path").normalize(__dirname + "/index.html");
const log = require("../../../tools/log");
let trace = 1,
  ln = "flowController/test/createFlowControler::";
trace ? log("i", ln, `Sterted`) : null;
const dev = new Device(iface.w2, 71);

let value = 0;
let props = {};
props.id = "N2";
props.shortName = { ua: "N2", en: "N2", ru: "N2" };
props.fullName = { ua: "Нітроген", en: "Ammonia", ru: "Азот" };
props.flowScale = { min: 0, max: 3 }; //m3
props.getDevicePV = async () => {
  return await dev.getAI();
};
props.setDeviceSP = async (val) => {
  return await dev.setAO(val);
};

props.getDevicePressure = async () => {
  let pressure = await dev.getDI();
  return pressure * 100;
};

props.pressureList = {
  alarm: 10, // %
  warning: 50,
  normal: 110,
  high: 120,
};
props.calibrationTable = [
  { x: 0, y: 0 }, // x=0..100%, y = m3/hr
  { x: 10, y: 0.5 },
  { x: 20, y: 0.75 },
  { x: 30, y: 1.2 },
  { x: 40, y: 1.6 },
  { x: 50, y: 1.9 },
  { x: 60, y: 2.2 },
  { x: 70, y: 2.5 },
  { x: 80, y: 2.8 },
  { x: 90, y: 3.1 },
  { x: 96, y: 3.3 },
  { x: 98, y: 3.35 },
  { x: 100, y: 3.4 },
];

//props.periodSets = { working: 1, waiting: 2, stabilization: 10 };

trace ? log("i", ln, `props=`, props) : null;

const fc = new FlowController(props);

if (trace) {
  log("i", ln, `fc=`);
  console.dir(fc);
}

//htmlFull(),
save(
  homeDir,
  fc.htmlFull(),
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
); //save();

module.exports = fc;

async function next() {
  try {
    //value += 10;

    //log("i", ln, "getSP() = ", fc.getSP());
    //log("i", ln, "current PV = ", fc.getPV());
    //log("i", ln, "current flow = ", fc.getCurrentFlow());
    log("i", ln, "getRegs=", fc.getRegs("SP;PV;state;pressure"));
    // log("i", ln, "getRegs=", fc.getRegs("SP;PV;flow;state;pressure"));
    //log("i", ln, "this.router = ");
    //console.dir(fc.router);
    console.log("--------------------------------");
  } catch (error) {
    log("e", error);
  }

  setTimeout(() => {
    next();
  }, 1000);
}

setInterval(async () => {
  //value = value >= 20 ? 0 : value + 10;
  value = value < 50 ? 50 : 20;
  await fc.setSP(value);
  log("w", ln, "setSP (", value, ") finished!");
}, 30000);

if (!module.parent) {
  setTimeout(() => {
    next();
  }, 3000);
}
