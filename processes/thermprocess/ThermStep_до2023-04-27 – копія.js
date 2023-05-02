// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

// заглушка, що імітує виконання асинхронного коду
const { dummyPromise } = require("../../tools/dummy.js");

/**
 * Класс, осуществляющий управление шагом термообработки
 * получает шаг и исполняет его
 * @class
 */
class ThermStep {
  /**
   * @param {object} device - об'єкт налаштованого приладу див. /devices/trp08/Manager.js
   * @param {object} step шаг программы в виде объекта
   * @param {number} step.reg=1    - *С, закон регулювання 1 -  ПІД; 2 - позиційний;
   * @param {number} step.tT=50    - *С, заданная температура
   * @param {number} step.dTmin=-10 - *С, минимальная тампература, ниже которой - ошибка
   * @param {number} step.dTmax=+10 - *С, максимальная тампература, выше которой - ошибка
   * @param {number} step.H=0      - мин, время разогрева
   * @param {number} step.errH=60    - мин, ошибка времени нарастания (если температура не достигнута по истечению времени (H+errH) - генерируется ошибка)
   * @param {number} step.Y=0      - мин, время выдержки
   * @param {number} step.o=2   - зона пропорційності
   * @param {number} step.ti=0  - інтегральний коефіцієнт ПІД
   * @param {number} step.td=0  - диференціальний коефіцієнт ПІД
   * @param {*} options - додаткові налаштування
   */

  constructor(device, step = {}) {
    this.ln = "ThermStep()::";
    // ----------- настройки логгера локальные --------------
    let logN = logName + "constructor:";
    let trace = 1;
    trace ? log("i", logN, "Started") : null;
    trace ? log("i", logN, "----------- incoming step: ------------") : null;
    trace ? console.dir(step) : null;
    // ----------- конец настроек

    if (!device) {
      throw new Error(logN + "Для кроку не вказаний прилад ");
    }
    this.device = device;
    this.errCounter = 10; // рахує помилки звязку, для виявлення помилки "немає звязку", загалом робиться 10*3=30 спроб, якщо = 0 - викидаємо помилку
    this.currT = 0; // поточна температура
    // ---------- парсимо крок -----------
    this.step = {};
    this.step.regMode = step.regMode ? step.regMode : 1;
    this.step.tT = step.tT ? step.tT : 50;
    this.step.dTmin = step.dTmin ? step.dTmin : -10;
    this.step.dTmax = step.dTmax ? step.dTmax : +10;
    this.step.H = step.H ? step.H : 0;
    this.step.errH = step.errH ? step.errH : 60;
    this.errHeatingTime = this.step.errH + 10; // утримання на етапі нагрівання Y = errH + 10 щоб очікувати вихід на режим всіх приладів
    this.step.Y = step.Y ? step.Y : 0;
    this.step.errY = step.errY ? step.errY : 20;
    this.step.o = step.o ? step.o : 2;
    this.step.ti = step.ti ? step.ti : 0;
    this.step.td = step.td ? step.td : 0;
    /** @param {number} this.state="очікування"  - стан кроку: 0=Очікування / 1=Нагрівання / 2=Витримка / 3=Помилка /  */
    this.state = { code: 0, note: "Очікування", timestamp: new Date() };
    this.startHeating = null;
    this.holdingTime = { start: null, end: null };
    trace ? log("i", logN, "----------- this.step: ------------") : null;
    trace ? console.dir(this.step) : null;
    this.ln = `ThermStep(id=${this.device.getId()};tT=${this.step.tT})::`;
  }

  /** функція запускає крок на виконання
   * @returns {Promise}
   */

  async go() {
    let trace = 1,
      ln = "heating():";
    trace ? console.log(ln, "Started") : null;
    // 1.1 завантажуємо налаштування в терморегулятор
    // копіюємо налаштування кроку
    let params = {
      regMode: this.step.regMode,
      tT: this.step.tT,
      H: this.step.H - parseInt(this.step.H / 20),
      Y: this.step.errH + 30,
      o: this.step.o,
      ti: this.step.ti,
      td: this.step.td,
      u: this.step.u,
    };
    trace ? log("w", ln, "params=", params) : null;
    try {
      // на всякий випадок зупиняємо прилад, бо якщо він знах. в режимі "Пуск" неможливо змінити regMode
      await this.device.stop();
      // 1.2 Записуємо сформований крок в терморегулятор
      await this.device.setParams(params);
      // 1.3 Запускаємо на виконання
      await this.device.start();
      // скидаємо таймер
      this.startHeating = new Date();
      // змінюємо стан
      this.state.code = 1;
      this.state.note = "Нагрівання";
      this.state.timestamp = new Date(); //
      // 1.4. Очікуємо розігріву печі
      await this.heating();
      log("w", "Нагрівання завершено");
      // зупиняємо прилад
      await this.device.stop();
      // коригуємо параметри
      params.H = 0;
      params.Y = this.step.Y;
      // записуємо налаштування в прилад
      await this.device.setParams(params);
      // запускаємо програму
      await this.device.start();
      // витримуємо
      await this.holding();
      log("w", "Витримка завершена");
    } catch (error) {
      let err = this.ln + "Крок завершився невдачею:" + error.message;
      log("e", err);
      return Promise.reject(new Error(err));
    }
    return Promise.resolve("Ok");
  }

  async holding() {
    let ln = this.ln + `Holding(Y=${this.step.Y}):`;
    let trace = 1;
    let finished = false;
    let waitTime = trace ? 1000 : 30 * 1000;
    let minT = this.step.tT + this.step.dTmin;
    let maxT = this.step.tT + this.step.dTmax;
    let errCounter = this.errCounter; // рахує помилки звязку, для виявлення помилки "немає звязку", якщо = 0 - викидаємо помилку
    // фіксуємо час початку витримки
    this.holdingTime.start = new Date();
    this.state = { code: 2, note: "Витримка", timestamp: this.holding.start };
    log("w", ln, "Holding started");
    let err = null;
    while (!finished) {
      // пауза
      await dummyPromise(waitTime);

      try {
        // запит температури
        this.currT = await this.device.getT();
        // коригуємо лічильник помилок
        if (errCounter < this.errCounter) {
          errCounter += 1;
        }
      } catch (error) {
        err = ln + "Помилка зчитування температури";
        // якщо лічильник помилок пустий - критична помилка - немає звязку з приладом
        if (errCounter <= 0) {
          finished = true;
        }
        errCounter--;
        log("e", err, " КількПомилок=", errCounter, "  ", error);
        continue;
      }
      // розрахунок часу
      let time =
        (new Date().getTime() - this.holdingTime.start.getTime()) / 1000 / 60;
      // для перевірки
      trace
        ? log(
            "i",
            ln,
            "currentT=",
            this.currT,
            "*C",
            "; time=",
            time.toFixed(2),
            " min"
          )
        : null;
      // перевіряємо чи температура в потрібному діапазоні, якщо ні - помилка
      if (this.currT > maxT || this.currT < minT) {
        err =
          this.ln +
          `Поточна температура вийшла за границю діапазону [${minT} ... ${maxT}]!!! Т=${this.currT}°C`;
        finished = true;
        continue;
      }
      if (time > this.step.Y) {
        finished = true;
        continue;
      }
    }
    this.holdingTime.end = new Date();
    if (err) {
      log("e", "Помилка:" + err);
      this.state.code = 3;
      this.state.note = err;
      this.state.timestamp = new Date();
      return Promise.reject(new Error(err));
    }
    log("w", ln, "Витримку закінчено!!! ");
    this.state.code = 0;
    this.state.note = "Очікування";
    this.state.timestamp = new Date();
    return Promise.resolve("Ok");
  } // holding

  async heating() {
    let minT = this.step.tT + this.step.dTmin;
    let ln =
      this.ln + `heating(minT=${minT};H=${this.step.H};Y=${this.step.Y}):`;
    let trace = 1;
    let errCounter = this.errCounter; // рахує помилки звязку, для виявлення помилки "немає звязку", якщо = 0 - викидаємо помилку
    let waitTime = trace ? 1000 : 30 * 1000;
    log("w", ln, "Started!!");
    let err = null;
    let finished = false;
    let time;
    //trace ? log("i", ln, "this.step=", this.step) : null;
    while (!finished) {
      await dummyPromise(1 * 1000);
      try {
        // пауза
        await dummyPromise(waitTime);
        // робимо запит в прилад
        this.currT = await this.device.getT();
        // коригуємо лічильник помилок
        if (errCounter < this.errCounter) {
          errCounter += 1;
        }
      } catch (error) {
        err = ln + "Помилка зчитування температури";
        // якщо лічильник помилок пустий - критична помилка - немає звязку з приладом
        if (errCounter <= 0) {
          finished = true;
        }
        errCounter--;
        log("e", err, " КількПомилок=", errCounter, "  ", error);
        continue;
      }
      // розраховуємо час, що пройшов від початку процесу
      time = (new Date().getTime() - this.startHeating.getTime()) / 1000 / 60;
      // діагностичне повідомлення
      trace
        ? log(
            "i",
            ln,
            "currentT=",
            this.currT,
            "*C",
            "; time=",
            time.toFixed(2),
            " min"
          )
        : null;
      if (this.currT > minT) {
        log("w", ln, "Температура досягнута!! ");
        finished = true;
        continue;
      }
      if (this.step.H == 0) {
        continue;
      }
      // перевіряємо чи не сплив час
      if (time > this.step.H + this.step.errH) {
        finished = true;
        err = ln + "Помилка! Перевищено час розігріву печі.";
        continue;
      }
    } // while loop

    if (err !== null) {
      log("e", "Процесс завершився з помилкою:" + err);
      this.state.code = 3;
      this.state.note = err;
      this.state.timestamp = new Date();
      return Promise.reject(new Error(err));
    }
    this.state.code = 0;
    this.state.note = "Очікування";
    this.state.timestamp = new Date();
    return Promise.resolve(ln + "Нагрівання закінчено");
  }
} //class ThermStep

module.exports = ThermStep;

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let step = new ThermStep();
  step.go();
}
