const { forEach } = require("core-js/core/array");
const device = require("./driver.js");

class Manager {
  constructor(iface, id) {
    this.trace = 1;
    this.ln = `managerTRP08(${id}):`;
    this.iface = iface;
    this.id = id;
    this.device = device;
  }
  async setParams(params = {}) {}
  async start() {}
  async stop() {}
  async getT() {}
  async getParams() {}
}
