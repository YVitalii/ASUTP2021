/**
 * Менеджер живого TRM-251: інтерфейс w2, адреса 16.
 * Конструктор сам запускає опитування режиму; для тесту воно вимкнене.
 */
const iface = require("../../../conf_iface.js").w2;
const Manager = require("../ManagerClassTRM251.js");

const ADDR = 16;

function testDevice() {
  Manager.prototype.getMode = async function () {};
  return new Manager({
    iface,
    addr: ADDR,
    id: "TRM251",
  });
}

module.exports = testDevice;
module.exports.iface = iface;
module.exports.Manager = Manager;
