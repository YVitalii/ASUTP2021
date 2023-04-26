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
   * @param {number} step.dTmin=-5 - *С, минимальная тампература, ниже которой - ошибка
   * @param {number} step.dTmax=+5 - *С, максимальная тампература, выше которой - ошибка
   * @param {number} step.H=0      - мин, время разогрева
   * @param {number} step.errH=60    - мин, ошибка времени нарастания (если температура не достигнута по истечению времени (H+errH) - генерируется ошибка)
   * @param {number} step.Y=0      - мин, время выдержки
   * @param {number} step.errY=20      - мин, время выдержки
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

    this.currT = 0; // поточна температура
    // ---------- парсимо крок -----------
    this.step = {};
    this.step.regMode = step.regMode ? step.regMode : 1;
    this.step.tT = step.tT ? step.tT : 50;
    this.step.dTmin = step.dTmin ? step.dTmin : -5;
    this.step.dTmax = step.dTmax ? step.dTmax : +5;
    this.step.H = step.H ? step.H : 0;
    this.step.errH = step.errH ? step.errH : 60;
    this.errHeatingTime = this.step.errH + 10; // утримання на етапі нагрівання Y = errH + 10 щоб очікувати вихід на режим всіх приладів
    this.step.Y = step.Y ? step.Y : 0;
    this.step.errY = step.errY ? step.errY : 20;
    this.step.o = step.o ? step.o : 2;
    this.step.ti = step.ti ? step.ti : 0;
    this.step.td = step.td ? step.td : 0;
    /** @param {number} this.state="очікування"  - стан кроку: 0=Очікування / 1=Нагрівання / 2=Витримка / 3=Помилка  */
    this.state = { code: 0, note: "Очікування", timestamp: new Date() };
    this.startHeating = null;
    trace ? log("i", logN, "----------- this.step: ------------") : null;
    trace ? console.dir(this.step) : null;
  }

  async go() {
    // запускає крок
    let trace = 1,
      ln = this.ln + "go()::";
    trace ? log("w", ln, "Started") : null;
    await this.heating();
    // await this.heating();
    // await this.delay();
    trace ? log("w", ln, "Finished") : null;
  } // go()

  //async heating() {}
  async heating() {
    let trace = 1,
      ln = "heating():";
    trace ? console.log(ln, "Started") : null;
    // 1.1 завантажуємо налаштування в терморегулятор
    // копіюємо налаштування кроку
    let params = {
      regMode: this.step.regMode,
      tT: this.step.tT,
      H: this.step.H - parseInt(this.step.H / 20),
      Y: this.errHeatingTime,
      o: this.step.o,
      ti: this.step.ti,
      td: this.step.td,
      u: this.step.u,
    };
    trace ? log("w", ln, "params=", params) : null;

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
    await this.waitHeating();
    log("e", "Нагрівання завершено");
    // 1.5.
  }

  async waitHeating() {
    let ln =
      this.ln + `waitHeating(taskT=${this.step.tT}; taskTime=${this.step.H}):`;
    let trace = 1;
    log("w", ln, "Started!!");
    let promis = Promise.resolve();
    let item = this;
    let err = null;
    let finished = false;
    let time;
    trace ? log("i", ln, "this.step=", this.step) : null;
    while (!finished) {
      await dummyPromise(1 * 1000);
      try {
        // робимо запит в прилад
        this.currT = await this.device.getT();
        // розраховуємо час, що пройшов від початку процесу
        time = (new Date().getTime() - this.startHeating.getTime()) / 1000 / 60;
        trace
          ? log(
              "i",
              ln,
              "currentT=",
              this.currT.value,
              "*C",
              "; time=",
              time.toFixed(2),
              " min"
            )
          : null;
      } catch (error) {
        log("e", ln, "Помилка зчитування температури", error);
      }
      if (this.currT.value > this.step.tT) {
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
      return Promise.reject(new Error(err));
    }
    return Promise.resolve(ln + "Нагрівання закінчено");

    // function wait(promis, item) {
    //   return new Promise((resolve, reject) => {
    //     promis
    //       .then(() => {
    //         return dummyPromise(1500);
    //       })
    //       .then(() => {
    //         return item.device.getT();
    //       })
    //       .then((val) => {
    //         log("Current T=", val);
    //         if (val > 30) {
    //           log("w", "Температура досягнута");
    //           resolve(val);
    //           return val;
    //         }
    //         return wait(promis, item);
    //       });
    //   });
    // }
    // wait(promis, item).then((val) => {
    //   resolve(val);
    //   return;
    // });

    // wait(promis, this).then((val) => {

    //   return resolve();
    // });

    // return new Promise(
    //   function wait(resolve, reject) {
    //     setTimeout(async () => {
    //       let trace = 1;
    //       await dummyPromise();
    //       if (trace) {
    //         console.log(ln, "this=");
    //         console.dir(this);
    //       }
    //       //this.currT = this.device.getT();
    //       setTimeout(() => {
    //         this.waitHeating;
    //       }, 1000);
    //       //log("i", ln, `currT=${this.currT}`);
    //       // log("w", ln, "Finished!!");

    //       //resolve(1);
    //     }, 5000);
    //   }.bind(this)
    // );

    // let trace = 1,
    //   traceTime = 0,
    //   taskT = this.step.tT + this.step.dTmin,
    //   taskTime = this.step.H + this.step.errH,
    //   time = 0;
    // let ln = this.ln + `waitHeating(taskT=${taskT}; taskTime=${taskTime}):`;
    // let reqPeriod = trace ? 250 : 10000;
    // try {
    //   if (trace) {
    //     // для тестування
    //     // await dummyPromise();
    //     this.currT += 1;
    //   } else {
    //     this.currT = await this.device.getT();
    //   }
    //   // якщо температура досягнута - вихід
    //   if (!this.currT > taskT) {
    //     log(
    //       "w",
    //       ln,
    //       `Нагрівання завершено успішно this.currT=${this.currT}, taskT=${taskT}`
    //     );
    //     resolve(1);
    //     return;
    //   }
    //   // розраховуємо час, що пройшов від початку процесу
    //   time = (new Date().getTime() - this.startHeating.getTime()) / 1000 / 60;
    //   if (trace) {
    //     // для тестування
    //     time = time * 6;
    //   }
    //   // перевіряємо чи не сплив час
    //   if (time > this.step.H + this.step.errH) {
    //     reject(new Error(ln + "Помилка!! Перевищено час нагрівання " + time));
    //     return;
    //   }
    // } catch (error) {
    //   log("e", this.ln + "setTimeout::wait::Помилка зчитування температури!");
    // }
    // trace
    //   ? log("i", ln, "this.currT=", this.currT, " час:", time.toFixed(1), "хв.")
    //   : null;
    // setTimeout(this.waitHeating.bind(this), reqPeriod);
  }
} //class ThermStep

module.exports = ThermStep;

if (!module.parent) {
  //виконується, якщо модуль завантажено окремо в командному рядку (немає батька)
  let step = new ThermStep();
  step.go();
}
