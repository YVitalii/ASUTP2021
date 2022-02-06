const TRP08 = require("./devicesClass.js");

function getDevice(iface, addr) {
  return new TRP08(iface, addr);
}
