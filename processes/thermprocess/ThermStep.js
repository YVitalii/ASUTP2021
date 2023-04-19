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
   * @param {object} step шаг программы в виде объекта
   * @param {number} step.reg=1    - *С, закон регулювання 1 -  ПІД; 2 - позиційний;
   * @param {number} step.tT=50    - *С, заданная температура
   * @param {number} step.dTmin=-5 - *С, минимальная тампература, ниже которой - ошибка
   * @param {number} step.dTmax=+5 - *С, максимальная тампература, выше которой - ошибка
   * @param {number} step.H=0      - мин, время разогрева
   * @param {number} step.errH=60    - мин, ошибка времени нарастания (если температура не достигнута по истечению времени (H+errH) - генерируется ошибка)
   * @param {number} step.Y=0      - мин, время выдержки
   * @param {number} step.errY=20      - мин, время выдержки
   * @param {number} step.o=2   - зона пропорційності
   * @param {number} step.di=0  - інтегральний коефіцієнт ПІД
   * @param {number} step.dt=0  - диференціальний коефіцієнт ПІД
   * @param {*} options настройки
   */

  constructor(step = {}, device) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "constructor:";
    let trace = 1;
    trace ? log("i", logN, "Started") : null;
    trace ? log("i", logN, "----------- incoming step: ------------") : null;
    trace ? console.dir(step) : null;
    // ----------- конец настроек

    // ---------- парсимо крок -----------
    this.step = {};
    this.step.reg = step.reg ? step.reg : 1;
    this.step.tT = step.tT ? step.tT : 50;
    this.step.dTmin = step.dTmin ? step.dTmin : -5;
    this.step.dTmax = step.dTmax ? step.dTmax : +5;
    this.step.H = step.H ? step.H : 0;
    this.step.errH = step.errH ? step.errH : 60;
    this.step.Y = step.Y ? step.Y : 0;
    this.step.errY = step.errY ? step.errY : 20;
    this.step.o = step.o ? step.o : 2;
    this.step.di = step.di ? step.di : 0;
    this.step.dt = step.dt ? step.dt : 0;
    /** @param {number} this.state="очікування"  - стан кроку: Очікування / Нагрівання / Витримка / Помилка  */
    this.step.state = "Очікування";

    trace ? log("i", logN, "----------- this.step: ------------") : null;
    trace ? console.dir(this.step) : null;
  }
  async go() {
    // запускає крок
    let trace = 1,
      lN = "go()";
    trace ? console.log(lN, "Started") : null;
    await this.startHeating();
    // await this.heating();
    // await this.delay();
    trace ? console.log(lN, "Finished") : null;
  } // go()
  async startHeating() {
    let trace = 1,
      lN = "startHeating():";
    trace ? console.log(lN, "Started") : null;
    // тут ми маємо завантажити дані в терморегулятор
    // причому утримання = errH + 10 щоб очікувати вихід на режим всіх приладів
    let params = {
      // копіюємо налаштування кроку
      reg: this.step.reg,
      tT: this.step.tT,
      H: this.step.H,
      Y: this.step.errH + 10,
      o: this.step.o,
      di: this.step.di,
      dt: this.step.dt,
    }; // копіюємо налаштування кроку
    if (trace) {
      console.log(ln, "params=");
      console.dir(params);
    }
    // await device.set(params)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        trace ? console.log(lN, "Timeout") : null;
        resolve();
      }, 1000);
    });
  }
} //class ThermStep

module.exports = ThermStep;

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let step = new ThermStep();
  step.go();
}
