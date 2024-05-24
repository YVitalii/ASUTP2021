const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");
class ClassQuickHeatingStep extends ClassThermoStepGeneral {
  /**
   * Крок "Швидке нагрівання" виконується в режимі ПОЗ до температури tT-wT
   * потім йде очікування першої хвилі, як тільки зростання температури за проміжок часу
   * (props.wave.period * props.wave.points) менше ніж
   * (props.wave.dT *props.wave.points), рахується що настав перегин
   * При 10 точках х 30 сек = 3 хв, тобто якщо за 3 хв.
   * температура зросла менше ніж 10*0,1=1*С - рахуємо що стабілізація виконана
   *
   * @param {Object} props
   * @property {Number|String} props.regs.wT=0 - *С; 0= вимкнено; закид першої хвилі перерегулювання
   * @property {Object}         props.wave - параметри пошуку точки перегину першої хвилі температури
   * @property {Number|String}  props.wave.period=30 - сек, період між опитуванням поточної температури.
   * @property {Number|String}  props.wave.dT=0.1 - *С, рахується що настала вершина хвилі, коли середня похідна менше цього значення
   * @property {Number|String}  props.wave.points=10, кількість точок для розрахунку середньої похідної
   *
   */
  constructor(props) {
    // props.header = props.header
    //   ? props.header
    //   : {
    //       ua: `Швидке нагрівання `,
    //       en: `Quick heating`,
    //       ru: `Быстрый нагрев`,
    //     };
    // props.ln = props.ln ? props.ln : props.header.ua + "::";

    props.id = props.id ? props.id : "quickHeating";
    props.ln = props.ln ? props.ln : props.id + "::";
    let trace = 0,
      ln = props.id + "::constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    super(props);

    ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `after super() this=`);
      console.dir(this);
    }

    if (!props.regs.wT || props.regs.wT == 0 || props.regs.wT > 0) {
      throw new Error(
        this.ln +
          `Для кроку швидкого нагрівання [${this.header.ua}] має бути вказано (wT < 0)!`
      );
    }
    this.wT = parseInt(props.regs.wT);

    this.H = 0; // грітися максимально швидко
    this.Y = 0; //для очікування виходу на режим суміжних приладів

    // this.beforeStart = async () => {
    //   log("w", ln, "beforeStart()::Started");
    //   console.dir(props.beforeStart);
    //   await props.beforeStart(this);
    //   log("w", ln, "beforeStart()::Completed");
    // };
    //

    // понижуємо температуру поточного завдання
    this.tT = this.tT + this.wT;

    //В цьому кроці не контролюємо нижню границю
    this.errTmin = 0;
    // Максимальний закид як для номінальної цільової tТ : - wT + errTmax
    this.errTmax = -this.wT + this.errTmax; //props.regs.errTmax;

    // Назва кроку
    let tT = `${this.tT} °C`;
    this.comment = {
      ua: `${this.device.header.ua}.Шв. нагр. до ${tT}`,
      en: `${this.device.header.en}.Quick heating to ${tT}`,
      ru: `${this.device.header.ru}.Быстрое нагр. до ${tT}`,
    };

    this.header = {
      ua: `=>${tT}`,
      en: `=>${tT}`,
      ru: `=>${tT}`,
    };

    // ----- параметри пошуку першої хвилі ----------
    props.wave = props.wave ? props.wave : {};
    this.wave = {};
    this.wave.checking = false; // пошук хвилі при true, щоб не виконувати пошук на початку
    this.wave.period = props.wave.period ? props.wave.period : 30;
    this.wave.dT = props.wave.dT ? props.wave.dT : 0.1;
    this.wave.points = props.wave.points ? props.wave.points : 10;
    this.wave.arr = []; // массив для зберігання останніх this.wave.points значень
    // курсор в масиві для вставляння нового значення
    this.wave.pointer = 0;
    // попередня температура
    this.wave.beforeT = 0;

    // --- немає сенсу перевіряти частіше ніж частота пошуку першої хвилі ----
    this.checkPeriod = this.wave.period;
    // --------------------------------
    this.ln = this.ln + `${this.id}(tT=${this.tT})::`;

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } //constructor

  async start() {
    // ініціалізація пошуку хвилі - заповнюємо масив 2-ками
    for (let i = 0; i < this.wave.points; i++) {
      this.wave.arr[i] = 2;
    }
    this.wave.pointer = 0;
    this.wave.checking = false;

    this.state.note = {
      ua: `Швидке нагрівання.`,
      en: `Quick heating`,
      ru: `Быстрое нагревание`,
    };
    this.logger(
      "i",
      `Started with: tT=${this.tT}; wT=${this.wT}; errTmin=${this.errTmin}C; errTmax=${this.errTmax}C; H=${this.H}min; Y=${this.Y}min;`
    );
    //this.testProcess();
    await super.start();
  }
  // TODO Коли немає звязку з приладом крок рахує що наступила вершина хвилі, що невірно
  //  потрібно додати очікування досягнення температури  tT-5, потім вмикати пошух перегину
  // Потрібно враховувати addT для кожного приладу, інакше буде помилка "перевищення температури" - враховується в батьківському класі
  /**
   * Перевірка стану процесу
   */
  async testProcess() {
    let trace = 0,
      ln = this.ln + "testProcess()::";
    trace ? this.logger("", `testProcess()::Started`) : null;
    if (!(await super.testProcess())) {
      return;
    }
    if (this.t != null) {
      //  пошук ознаки виходу на режим
      // якщо не досягнута температура this.tT-5*C то не перевіряємо
      // наприклад спрацював КВ дверей і нагрівання вимкнулося: dT == 0
      // якщо не перевіряти поточну термпературу - процес завершиться успішно = помилка
      if (!this.wave.checking && this.t > this.tT - 5) {
        this.wave.checking = true;
        this.state.note = {
          ua: `Очікування стабілізації`,
          en: `Waiting for stabilization`,
          ru: `Ожидание стабилизации`,
        };
        this.logger(
          "w",
          `t=${this.t}>(tT-5). Вмикаємо очікування стабілізації температури`
        );
        this.wave.beforeT = this.t;
      }

      if (this.wave.checking && this.checkWave()) {
        // є стабілізація, вихід
        return;
      }
    } else {
      // температура наразі не відома
      log("", ln + `this.t=${this.t}. Exit. Will be check wave next time`);
    }

    //  наступна ітерація
    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
  } //testProcess()

  checkWave() {
    let t = this.t;

    let trace = 0,
      ln = this.ln + "checkWave(" + JSON.stringify(t) + ")::";

    // поточний приріст температури (похідна)
    let dT = t - this.wave.beforeT;
    // запамятовуємо поточну температуру
    this.wave.beforeT = t;
    // заносимо в таблицю похідну
    this.wave.arr[this.wave.pointer] = dT;
    // переносимо вказівник на наступну чарунку таблиці
    this.wave.pointer += 1;
    if (this.wave.pointer >= this.wave.points) {
      this.wave.pointer = 0;
    }

    if (trace) {
      console.log(ln + ` this.wave=`);
      console.dir(this.wave);
    }
    // рахуємо середнє значення по таблиці
    let sum = 0;
    for (let i = 0; i < this.wave.points; i++) {
      sum += this.wave.arr[i];
    }
    sum = sum / this.wave.points;

    let info = `t=${this.t}*C; dT=${sum.toFixed(2)}`;
    this.logger("", `${info}`);

    if (sum <= this.wave.dT) {
      let msg = {
        ua: `Температура стабілізувалася: ${info}`,
        en: `Current temperature stabilized : ${info}`,
        ru: `Температура стабилизировалась: ${info}`,
      };
      this.logger("w", msg.en);
      this.finish(msg);
      return true;
    }
    return false;
  } //  checkWave(t)
} // class

module.exports = ClassQuickHeatingStep;

if (!module.parent) {
}
