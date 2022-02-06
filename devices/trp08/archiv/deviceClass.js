const rs485 = require ('../../rs485/rs485_server.js');

// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

/**
 * модуль, возвращающий настроенный экземпляр терморегулятора
 * @class
 */
class Device {
    #title = "Устройство №"
  /**
   * предварительная настройка прибора
   * @param {Number} addr  - адрес прибора в сети rs485 интерфейса iface
   * @param {Object} options  - постоянные настройки этого прибора
   */

  constructor(addr, options) {  
    this.addr=addr;
    this.rs485=rs485;
    #title += addr + ":"


  } // constructor
    

  /**
   * функция вносит задание в прибор
   * @param {} options.=      -
   * @param {} options.=      -
   */

  async setTask(options) {
    log("w",`${#title}. Set parameters:`);
    console.dir (options)
    return 1;
  } // setTask

  /**
   * запуск задания
   * @returns Promise
   */
  async start() {
    log("w",`${#title}. Started.`);
    return 1;
  } // start

  /**
   * остановка прибора
   * @returns Promise
   */
  async stop() {
    log("w",`${#title}. Stoped.`);
    return 1;
  }

  /**
   * возвращает текущую температуру
   * @returns Number *С
   */
  getT() {
    log("w",`${#title}. CurrentT:`);
    return 1;
  }
} // class Device

module.exports = Device;