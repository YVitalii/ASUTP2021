const ThermStep = require("../ThermStep.js");
const iface = require("../../../rs485/RS485_v200.js");

const device = require("../../../devices/trp08/manager.js");

let step = {};
var task = new ThermStep(step, device, { addT: 5 });
