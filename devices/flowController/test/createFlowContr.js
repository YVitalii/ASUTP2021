const Device = require("../../WAD-MIO-MAXPro-645/manager");
const iface = require("../../../rs485/RS485_v200");
const FlowController = require("../classFlowController.js");
const log = require("../../../tools/log");
let trace = 1,
  ln = "flowController/test/createFlowControler::";

const dev = new Device(iface, 73);
let value = 0;
let props = {};
props.id = dev.getId();
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
