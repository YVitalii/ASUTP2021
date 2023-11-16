/** модуль описує всі пристрої, що є в системі */
const iface = require("../../../conf_iface.js");
const MaxPRO_645 = require("../../../devices/WAD-MIO-MAXPro-645/manager.js");
const TRP08 = require("../../../devices/TRP08/manager.js");

//const MAXPro_645 = require("./WAD-MIO-MAXPro-645/manager.js");

const log = require("../../../tools/log.js");

const devices = [];

devices.A22 = new MaxPRO_645(iface.w2, 73);
devices.A24 = new MaxPRO_645(iface.w2, 72);
devices.A25 = new MaxPRO_645(iface.w2, 74);
devices.A13 = new MaxPRO_645(iface.w2, 71);
devices.furnaceTRP = new TRP08(iface, 1);
devices.retortTRP = new TRP08(iface, 2);

module.exports = devices;

// console.dir(devices);
