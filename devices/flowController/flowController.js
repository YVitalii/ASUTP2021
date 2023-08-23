/**
 * Класс, що керує роботою блоку вводу-виводу WAD-MIO-MAXPro-645
 */
const device = require("../WAD-MIO-MAXPro-645/driver.js"); //драйвер приладу
const log = require("../../tools/log.js");

class MaxPRO_645 {
  /**
   * @param {Object} iface - об'єкт інтерфейсу RS485 до якого підключено цей прилад
   * @param {Integer} id - адреса приладу в iface
   * @param {Object} props - об'єкт з налаштуваннями
   * */
  constructor(iface = null, id = null, props = null) {
    this.ln = "MaxPro645_Manager()::";
    let ln = this.ln + "constructor()::";
    // -------- id  ---------------
    if (!id) {
      let err = ln + "Має бути вказана адреса приладу";
      log("e", err);
      throw new Error(err);
    }
    this.id = id;
    // ----- iface --------------------------------
    if (!iface) {
      let err = ln + "Має бути вказаний інтерфейс для звязку з приладом";
      log("e", err);
      throw new Error(err);
    }
    this.iface = iface;
    this.value;
  }
}
