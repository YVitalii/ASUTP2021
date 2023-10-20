/** модуль описує всі пристрої, що є в системі */
const iface_2W = require("../rs485/RS485_v200.js");
const MaxPRO_645 = require("./WAD-MIO-MAXPro-645/manager.js");

const MAXPro_645 = require("./WAD-MIO-MAXPro-645/manager.js");

const log = require("../tools/log.js");

const devices2w = {};

devices2w.NH3sm = new MaxPRO_645(iface2w, id=73);
devices2w.NH3lg = new MaxPRO_645(iface2w, 72);
devices2w.N2 = new MaxPRO_645(iface2w, 71);
devices2w.CO2 = new MaxPRO_645(iface2w, 74);

module.exports = devices2w;
