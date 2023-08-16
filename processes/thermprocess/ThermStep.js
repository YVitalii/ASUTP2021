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
   * @param {object} step - об`єкт = крок програми
   * @param {number} step.startT=0 - *С, стартова температура кроку (для визначення типу кроку нагрівання/витримка)
   * @param {number} step.tT=50    - *С, цільова температура
   * @param {number} step.reg=1    - *С, закон регулювання: 1 -  ПІД; 2 - позиційний;
   * @param {number} step.dTmin= (-step.tT) - *С, допустима нижня границя температури, нижче якої - помилка =0 - немає обмежень
   * @param {number} step.dTmax=+15 - *С, допустима верхня границя температури, вище якої - помилка
   * @param {number} step.time=0      - хв., час кроку 0 = максимально швидко
   * @param {number} step.errTime=60  - хв, помилка часу кроку (наприклад не працює нагрівання - можна очікувати вічно)
   * @param {number} step.o=2   - ПІД = зона пропорційності / ПОЗ = різниця температури
   * @param {number} step.ti=0  - інтегральний коефіцієнт ПІД
   * @param {number} step.td=0  - диференціальний коефіцієнт ПІД
   * @param {number} step.u=0  - уставка
   */
  #ERR_COUNT = 5;
  constructor(device, step = {}) {
    this.ln = "ThermStep()::";
    // ----------- настройки логгера локальные --------------
    let logN = this.ln + "constructor:";
    let trace = 1;
    trace ? log("i", logN, "Started: ", step) : null;

    // прилад
    if (!device) {
      throw new Error(logN + "Для кроку не вказаний прилад ");
    }
    this.device = device;
    // рахує помилки звязку, для виявлення помилки "немає звязку", загалом робиться 10*3=30 спроб, якщо = 0 - викидаємо помилку
    this.errCounter = this.#ERR_COUNT;
    log("i", `this.errCounter=${this.errCounter}`);
    // поточна температура
    this.currT = 0;
    // ---------- парсимо крок -----------
    this.step = {};

    this.step.startT = (step.startT ? step.startT : 0) + device.getAddT();
    this.step.tT = (step.tT ? step.tT : 50) + device.getAddT();
    this.step.dTmin = step.dTmin ? step.dTmin : -10;
    this.step.dTmax = step.dTmax ? step.dTmax : +10;
    this.step.time = step.time ? step.time : 0;
    this.step.errTime = step.errTime ? step.errTime : 60;
    this.step.reg = step.reg ? step.reg : 1;
    this.step.o = step.o ? step.o : 2;
    this.step.ti = step.ti ? step.ti : 0;
    this.step.td = step.td ? step.td : 0;
    this.step.u = step.u ? step.u : 0;

    // якщо температури початку та кінця кроку співпадають то тип кроку = витримка , інакше - нагрівання
    this.step.holding = this.step.startT === this.step.tT;
    if (this.step.holding) {
      // тип кроку: витримка
      this.step.H = 0;
      this.step.Y = this.step.time;
    } else {
      // тип кроку: нагрівання
      this.step.H = parseInt((step.time ? step.time : 0) - step.errTime * 0.2); // даємо на 20% менше часу запасу для розігрівання - щоб компенсувати відставання
      if (this.step.H < 0) {
        this.step.H = 0;
      }
      this.step.Y = this.step.errTime + 10; // запас 10 хв - щоб спіймати перевищення часу до закінчення кроку
    }

    // час початку процесу
    this.startTime = null;
    this.forceStop = false; // індикатор команди "Стоп"
    this.timer = 0;
    let str = `[${this.step.startT} ${
      !this.step.holding ? "-->" + this.step.tT : ""
    }]*C`;
    this.ln = `ThermStep (id=${this.device.getId()};tT=${str};time= ${
      this.step.time
    })_${this.step.holding ? "Витримка" : "Нагрівання"}::`;
    trace ? log("i", logN, this.step) : null;
  }

  /** Функція зупиняє поточний процесс */

  async stop() {
    let trace = 1,
      ln = this.ln + 'stop()::Отримано сигнал "Стоп"';
    trace ? log("e", ln) : null;
    this.forceStop = true;
  }

  /** функція бере паузу, потім надсилає запит поточної температури на прилад
   * та записує його в this.currT, також оновлює таймер this.timer
   * у випадку помилки, змінює лічильник,
   * [(tT - dTmin) ... (tT + dTmax)]
   * @returns {Promise}  resolve(), reject(err) - якщо досягнута гранична кількість помилок
   *
   * */

  async iterate() {
    let trace = 1;
    let ln = this.ln + `iterate():`;
    let waitTime = trace ? 1000 : 30 * 1000;
    let err = null;

    //trace ? log("i", ln, "Started") : null;
    await dummyPromise(waitTime);
    // log("e", "In iterate()");
    try {
      // запит температури
      this.currT = await this.device.getT();
      // коригуємо лічильник помилок
      if (this.errCounter < this.#ERR_COUNT) {
        this.errCounter++;
      }
    } catch (error) {
      err = ln + "Помилка зчитування температури";
      // якщо лічильник помилок пустий - критична помилка - немає звязку з приладом
      if (this.errCounter <= 0) {
        return Promise.reject(err);
      }
      this.errCounter--;
      log(
        "e",
        err,
        " КількПомилок=",
        this.#ERR_COUNT - this.errCounter,
        "  ",
        error
      );
      return 1;
    }
    // розрахунок часу
    this.timer = (new Date().getTime() - this.startTime.getTime()) / 1000 / 60;
    // для перевірки
    trace
      ? log(
          "i",
          ln,
          "currentT=",
          this.currT,
          "*C",
          "; time=",
          this.timer.toFixed(2),
          " min"
        )
      : null;
    return 1;
  } // iterate

  /** функція запускає крок на виконання
   * @returns {Promise}
   */
  async go() {
    let trace = 1,
      ln = this.ln + "go():";
    trace
      ? console.log(
          `------------------------ Крок ${this.ln} Started --------------------`
        )
      : null;
    // робимо налаштування
    let params = {
      tT: this.step.tT,
      H: this.step.H,
      Y: this.step.Y,
      o: this.step.o,
      regMode: this.step.reg,
    };
    if ((this.step.reg = 1)) {
      // якщо ПІД то додаємо параметри
      params.ti = this.step.ti;
      params.td = this.step.td;
      params.u = this.step.u;
    }
    trace ? log("w", ln, "params=", params) : null;

    try {
      // зупиняємо прилад, бо якщо він знах. в режимі "Пуск" неможливо змінити regMode
      await this.device.stop();
      // 1.2 Записуємо сформований крок в терморегулятор
      await this.device.setParams(params);
      // 1.3 Запускаємо на виконання
      await this.device.start();
      // скидаємо таймер
      this.startTime = new Date();
      // запускаємо на виконання
      if (this.step.holding) {
        await this.holding();
      } else {
        await this.heating();
      }
      // 2023-06-27 - в кінці кроку не зупиняємо прилади, а зупиняємо на початку кроку
      // так як для багатозонних печей на стадії нагрівання потрібно очікування поки вийдуть на режим всі прилади
      // вони і так зупиняться, коли вичерпається час
      // 2023-05-01 - зупиняємо виконання програми

      // await this.device.stop();
    } catch (error) {
      let err = this.ln + "Крок завершився невдачею:" + error.message;
      trace ? log("e", err) : null;
      await this.device.stop();
      return Promise.reject(new Error(err));
    }
    return Promise.resolve("Ok");
  }

  async holding() {
    let ln = this.ln + `Holding(Y=${this.step.Y}):`;
    let trace = 1;
    let finished = false;
    log("w", ln, "Started");
    let minT = this.step.tT + this.step.dTmin;
    let maxT = this.step.tT + this.step.dTmax;
    let err = null;
    while (!finished) {
      // пауза
      try {
        // запит температури
        await this.iterate();
      } catch (error) {
        err = ln + "Помилка зчитування температури";
        finished = true;
        log(
          "e",
          "Досягнута гранична  КількПомилок=",
          this.#ERR_COUNT - this.errCounter,
          "  ",
          error
        );
        continue;
      }
      // перевіряємо чи немає команди "Стоп"
      if (this.forceStop) {
        err = this.ln + `Отримана команда "Стоп" `;
        finished = true;
        continue;
      }
      // перевіряємо чи температура в потрібному діапазоні, якщо ні - помилка
      if (this.currT > maxT || this.currT < minT) {
        err =
          this.ln +
          `Поточна температура вийшла за границю діапазону [${minT} ... ${maxT}]!!! Т=${this.currT}°C`;
        finished = true;
        continue;
      }
      if (this.timer > this.step.time) {
        finished = true;
        continue;
      }
    }
    if (err) {
      let error = ln + "Помилка:" + err;
      log("e", error);
      return Promise.reject(new Error(error));
    }
    log("w", ln, "Витримку закінчено!!! ");
    finished = true;
    return Promise.resolve("Ok");
  } // holding

  /** відповідає за етап розігріву печі, потрібно виконувати окремо,
   *  так в багатозонних печах потрібно очікувати поки розігріються всі зони
   *  і тільки потім починати рахувати витримку
   *  */

  async heating() {
    // 2023-06-28 Прибрали врахування this.step.dTmin, тому що при переході на крок holding
    // при падінні температури в печі хоча б на 1*С - програма йде в помилку,
    // бо поточна температура вийшла за границі контрольованого інтервалу
    let minT = this.step.tT; //+ this.step.dTmin;
    let ln =
      this.ln +
      `heating(minT=${minT};H=${this.step.H ? 0 : this.step.H};Y=${
        this.step.Y ? this.step.Y : 0
      }):`;
    let trace = 1;
    let err = null;
    let finished = false;
    log("w", ln, "Started!!");
    //trace ? log("i", ln, "this.step=", this.step) : null;
    while (!finished) {
      try {
        // робимо запит в прилад
        await this.iterate();
      } catch (error) {
        err =
          ln +
          "Досягнута гранична  КількПомилок=" +
          this.#ERR_COUNT -
          this.errCounter +
          "::";
        finished = true;
        log("e", err, error);
        continue;
      }
      // перевіряємо чи немає команди "Стоп"
      if (this.forceStop) {
        err = this.ln + `Отримана команда "Стоп" `;
        finished = true;
        continue;
      }
      // Перевіряємо температуру
      if (this.currT > minT) {
        log("w", ln, "Температура досягнута!! ");
        finished = true;
        continue;
      }
      // Якщо час розігріву не заданий - далі не перевіряємо
      if (this.step.H == 0) {
        continue;
      }
      // перевіряємо чи не сплив час
      if (this.timer > this.step.time + this.step.errTime) {
        finished = true;
        err = ln + "Помилка! Перевищено час розігріву печі.";
        continue;
      }
    } // while loop

    if (err !== null) {
      trace ? log("e", "Процесс завершився з помилкою:" + err) : null;
      return Promise.reject(new Error(err));
    }
    return Promise.resolve(ln + "Нагрівання закінчено");
  }
} //class ThermStep

module.exports = ThermStep;

// if (!module.parent) {
//   //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
//   let step = new ThermStep();
//   step.go();
// }
