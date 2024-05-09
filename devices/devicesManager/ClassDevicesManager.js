const log = require("../../tools/log");
const pug = require("pug");
const resolvePath = require("path").resolve;

/** Клас для керування приладами */

module.exports = class ClassDevicesManager {
  /**
   *
   * @param {*} props
   * @property {Object} props.iface - інтерфейс
   * @property {} props.baseUrl - базовий шлях (далі авт. додається "/devices")
   * @property {} props. -
   */
  constructor(props = {}) {
    this.ln = props.ln ? props.ln : "ClassDevicesManager::";
    let trace = 0,
      ln = this.ln + "constructor()::";

    // ------- baseUrl ----------
    this.baseUrl = props.baseUrl
      ? props.baseUrl
      : (() => {
          throw new Error(ln + "baseUrl must be setted!");
        })();
    this.homeUrl = this.baseUrl + "/devicesManager/";
    // --------- devices ---------
    this.devices = {};
  } // constructor()

  /**
   * Реєструє прилад в менеджері. Інтерфейс передається кожному приладу окремо,
   *  так як в одному менеджері можуть бути прилади з різними інтерфейсами
   * @param {*} dev - екземпляр приладу
   * @param {String} id - ідентифікатор
   */
  addDevice(id, dev) {
    let trace = 0,
      ln = this.ln + `addDevice(${dev})::`;
    if (!dev) {
      throw new Error(ln + "the Device must be setted!");
    }
    if (this.devices[id]) {
      throw new Error(ln + "Other device with same name was defined before!");
    }
    this.devices[id] = dev;
  }

  /**
   * Повертає посилання на прилад.
   * @param {String} id - ідентифікатор
   */

  getDevice(id) {
    let trace = 0,
      ln = this.ln + `getDevice(${id})::`;
    return this.devices[id];
  }

  getAll(id) {
    return this.devices;
  }
  /** Зупиняє всі зареєстровані прилади  */
  async stopAll() {
    try {
      for (const dev in this.devices) {
        if (Object.hasOwnProperty.call(this.devices, dev)) {
          await this.devices[dev].stop();
        }
      }
      return true;
    } catch (error) {
      throw new Error(error);
    }
  } // async stopAll()

  getCompactHtml(req) {
    let content = "";
    for (let key in this.getAll()) {
      content += this.getDevice(key).getCompactHtml({
        baseUrl: this.homeUrl,
        prefix: "devicesManager_",
      });
    }

    let html = pug.renderFile(
      resolvePath(
        req.locals.homeDir +
          "/devices/devicesManager/views/fullDevicesManager.pug"
      ),
      { homeUrl: this.homeUrl, content }
    );
    return html;
  } // getCompactHtml(
};
