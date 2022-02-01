// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;
// trace ? log("i",logN,"Started") : null;
// ----------- конец настроек

/**
 * Класс, осуществляющий управление шагом термообработки
 * получает шаг и исполняет его
 * @class
 */
class ThermStep {
  /**
   * @param {object} step шаг программы в виде объекта {tT:500;dTmin:-5;dTmax:5;H:60;dH:30;Y:30}
   * @param {number} step.tT=50    - *С, заданная температура
   * @param {number} step.dTmin=-7 - *С, минимальная тампература, ниже которой - ошибка
   * @param {number} step.dTmax= 7 - *С, максимальная тампература, выше которой - ошибка
   * @param {number} step.H=0      - мин, время разогрева
   * @param {number} step.dH=60    - мин, ошибка времени нарастания (если температура не достигнута по истечению времени (H+dH) - генерируется ошибка)
   * @param {number} step.Y=0      - мин, время выдержки
   * @param {*} options настройки
   */

  constructor(step, device) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "constructor:";
    let trace = 1;
    trace ? log("i", logN, "Started") : null;
    trace ? log("i", logN, "----------- step: ------------") : null;
    trace ? console.dir(step) : null;

    // ----------- конец настроек
    // ---------- парсим шаг -----------
    this.step = {};
    this.step.tT = step.tT ? step.tT : 50;
    this.step.dTmin = step.dTmin ? step.dTmin : -7;
    this.step.dTmax = step.dTmax ? step.dTmax : +7;
    this.step.H = step.H ? step.H : 0;
    this.step.dH = step.dH ? step.dH : 60;
    this.step.Y = step.Y ? step.Y : 0;
    trace ? log("i", logN, "----------- this.step: ------------") : null;
    trace ? console.dir(this.step) : null;
  }
} //class ThermManager

module.exports = ThermStep;
