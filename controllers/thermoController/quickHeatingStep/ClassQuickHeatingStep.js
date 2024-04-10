const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");
class ClassQuickHeatingStep extends ClassThermoStepGeneral {
  /**
   * Крок "Швидке нагрівання" виконується в режимі ПОЗ до температури tT-wT
   * потім йде очікування першої хвилі, як тільки зростання температури за проміжок часу
   * (props.regs.wave.period * props.regs.wave.points) менше ніж
   * (props.regs.wave.dT *props.regs.wave.points), рахується що настав перегин
   * При 10 точках х 30 сек = 3 хв, тобто якщо за 3 хв.
   * температура зросла менше ніж 10*0,1=1*С - рахуємо що стабілізація виконана
   *
   * @param {Object} props
   * @property {async Function} props.regs.wT=0 - *С; 0= вимкнено; закид першої хвилі перерегулювання
   * @property {Object}         props.regs.wave - параметри пошуку точки перегину першої хвилі температури
   * @property {Number|String}  props.regs.wave.period=30 - сек, період між опитуванням поточної температури.
   * @property {Number|String}  props.regs.wave.dT=0.1 - *С, рахується що настала вершина хвилі, коли середня похідна менше цього значення
   * @property {Number|String}  props.regs.wave.points=10, кількість точок для розрахунку середньої похідної
   *
   */
  constructor(props) {
    props.header = props.header
      ? props.header
      : {
          ua: `Швидке нагрівання `,
          en: `Quick heating`,
          ru: `Быстрый нагрев`,
        };
    props.ln = props.ln ? props.ln : props.header.ua + "::";

    super(props);

    let trace = 0,
      ln = this.ln + "constructor()::";

    if (!props.regs.wT || props.regs.wT == 0 || props.regs.wT > 0) {
      throw new Error(
        this.ln +
          `Для кроку швидкого нагрівання [${this.header.ua}] має бути вказано (wT < 0)!`
      );
    }

    this.H = 0; // грітися максимально швидко
    this.Y = 0; //для очікування виходу на режим суміжних приладів

    this.beforeStart = async () => {
      props.beforeStart(this);
    };
    //
    this.wT = parseInt(props.regs.wT);

    // понижуємо температуру поточного завдання
    this.tT = this.tT + this.wT;

    //В цьому кроці не контролюємо нижню границю
    this.errTmin = 0;
    // Максимальний заккид як для номінальної цільової Т - wT + errTmax
    this.errTmax = -this.wT + props.regs.errTmax;

    // Назва кроку
    let tT = `${this.tT} &deg;C`;
    this.comment = {
      ua: `Шв. нагр. до ${tT}`,
      en: `Quick heating to ${tT}`,
      ru: `Быстрое нагр. до ${tT}`,
    };
    this.header = {
      ua: `=>${this.tT}`,
      en: `=>${this.tT}`,
      ru: `=>${this.tT}`,
    };
    this.id = "quickHeating";
    // ----- параметри пошуку першої хвилі ----------
    props.regs.wave = props.regs.wave ? props.regs.wave : {};
    this.wave = {};
    this.wave.period = props.regs.wave.period ? props.regs.wave.period : 30;
    this.wave.dT = props.regs.wave.dT ? props.regs.wave.dT : 0.1;
    this.wave.points = props.regs.wave.points ? props.regs.wave.points : 10;
    this.wave.arr = []; // массив для зберігання останніх this.wave.points значень
    // курсор в масиві для вставляння нового значення
    this.wave.pointer = 0;
    // попередня температура
    this.wave.beforeT = 0;
    // для ініціалізації заповнюємо масив 2-ками
    for (let i = 0; i < this.wave.points; i++) {
      this.wave.arr.push(2);
    }
    // --- немає сенсу перевіряти частіше ніж частота пошуку першої хвилі ----
    this.checkPeriod = this.wave.period;
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } //constructor

  async start() {
    this.testProcess();
    return await super.start();
  }
  // TODO Коли немає звязку з приладом крок рахує що наступила вершина хвилі, що невірно
  //  потрібно додати очікування досягнення температури  tT-5, потім вмикати пошух перегину
  // TODO Потрібно враховувати addT для кожного приладу, інакше буде помилка "перевищення температури"
  /**
   * Перевірка стану процесу
   */
  async testProcess() {
    let trace = 0,
      ln = this.ln + "testProcess()::";
    trace ? this.logger("i", ln, `Started`) : null;
    if (!(await super.testProcess())) {
      return;
    }
    if (this.checkWave()) {
      return;
    }
    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
  } //testProcess()

  checkWave() {
    let t = this.t;
    let trace = 0,
      ln = this.ln + "checkWave(" + t + ")::";

    let dT = t - this.wave.beforeT;
    this.wave.beforeT = t;
    this.wave.arr[this.wave.pointer] = dT;
    this.wave.pointer += 1;

    if (this.wave.pointer >= this.wave.points) {
      this.wave.pointer = 0;
    }

    if (trace) {
      console.log(ln + ` this.wave=`);
      console.dir(this.wave);
    }

    let sum = 0;
    for (let i = 0; i < this.wave.points; i++) {
      sum += this.wave.arr[i];
    }
    sum = sum / this.wave.points;
    trace = 1;
    trace ? console.log(ln + `dT=${dT}C` + `;sum=` + sum) : null;

    if (sum <= this.wave.dT) {
      let info = `t=${this.t}*C; dt=${sum.toFixed(2)}`;
      let msg = {
        ua: `Температура стабілізувалася: ${info}`,
        en: `Current temperature stabilized : ${info}`,
        ru: `Температура стабилизировалась: ${info}`,
      };
      this.logger("w", ln + msg.en);
      this.finish(msg);
      return true;
    }
    return false;
  } //  checkWave(t)
} // class

module.exports = ClassQuickHeatingStep;

if (!module.parent) {
}
