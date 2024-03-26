/** модуль описує всі пристрої, що є в системі */
const iface = require("../../../conf_iface.js");

const TRP08 = require("../../../devices/TRP08/manager.js");

const log = require("../../../tools/log.js");

const devices = [];

devices.TRP = new TRP08(iface, 1);

module.exports = devices;

// console.dir(devices);
