const device = require("./driver.js");

class Manager {
  constructor(iface, id) {
    this.iface = iface;
    this.id = id;
    this.device = device;
  }
  async setParams() {}
  async start() {}
  async stop() {}
  async getT() {}
  async getParams() {}
}
