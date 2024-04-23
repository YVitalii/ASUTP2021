const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");
const dummy = require("../../../tools/dummy").dummyPromise;
const ClassLinearFunction =
  require("../../../tools/general.js").ClassLinearFunction;

class ClassHeatingStep extends ClassThermoStepGeneral {
  /**
   *
   * @param {*} params
   * @property {Number|String} props.H=0 - хв; час нагрівання; 0= макс.швидко;
   * @property {Number|String} props.errH=60 - хв; помилка часу нагрівання; помилка якщо тривалість більше ніж: H + errH ;
   *
   *
   */
  constructor(props = {}) {
    // props.headers =
    //   props.headers && props.headers.ua
    //     ? props.headers
    //     : {
    //         ua: `Нагрівання`,
    //         en: `Heating`,
    //         ru: `Нагрев`,
    // };
    props.id = "heating";
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

    // ---- час нагрівання ---------
    this.H = props.regs.H ? props.regs.H : 0;
    //
    this.errH = parseInt(props.regs.errH ? props.regs.errH : 0);
    this.errH = isNaN(this.errH) ? 0 : this.errH;

    // ---- час витримки = 0, так як потрібно очікувати розігрів суміжних приладів ---------
    // --- при H != 0, та Y==0, ТРП не утримує температуру, а вимикає нагрівання, тому
    // --- задаємо утримання 60 хв щоб встигли розігрітися всі суміжні прилади
    this.Y = this.H == 0 ? 0 : 60;

    // цільова температура = tT
    // так як при Н!=0 поточна цільова температура з часом постійно змінюється
    // то запамятовуємо її в окремій змінній, для того щоб контролювати момент завершення кроку
    this.goal_tT = this.tT;

    // цільовий коридор температури знизу, потрібен для визначення точки фінішу
    this.goalErrTmin = this.errTmin;

    // ---- поточна нижня границя температури ----------
    // якщо час розігріву не вказано - вимикаємо нижню межу температури
    // або подвоюємо її для процесу нагрівання за вказаний час
    // тобто буде вважатися нормальним this.t >  this.tT - errTmin * 2
    // попередження при:  this.tT - errTmin * 2 < this.t <  this.tT - errTmin * 4
    // помилка при : this.tT - errTmin * 4 < this.t
    this.errTmin = this.H == 0 ? 0 : this.errTmin * 2;

    // -- верхню межу температури піднімаємо
    this.errTmax = this.tT + this.errTmax - this.goal_tT;

    // ---- поточна цільова температура Функція що вираховує current tT -----
    this.curr_tT;
    // на 2024-04-09 не працює лінійна інтерполяція завдання
    //  TODO Зробити контроль поточної цільової температури при Н != 0 Поки: милиця

    // Назва кроку
    let tT = `${this.goal_tT}°C`;
    this.comment = {
      ua: `${this.device.header.ua}.Нагрівання до ${tT}`,
      en: `${this.device.header.en}.Heating to ${tT}`,
      ru: `${this.device.header.ru}.Нагрев до ${tT}`,
    };

    this.header = {
      ua: `->${tT}`,
      en: `->${tT}`,
      ru: `->${tT}`,
    };
    // --------------------------------
    this.ln = `${this.id}(goal tT=${this.tT};H=${this.H}min)::`;
    // цільова точка завдання
    this.stepPoints.push({
      dTime: this.H != 0 ? this.H : undefined,
      value: this.goal_tT,
      valMin: this.errTmin,
      valMax: this.errTmax,
    });

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } // constructor

  async start() {
    // визначаємо коєфіцієнти для функції зміни цільової температури
    // для розр. коефіцієнтів, визначаємо поточну температуру
    if (this.t == null) {
      while (this.t == null) {
        this.t = await this.getT();
        if (this.t == null) {
          await dummy(3);
        }
      } //while
    } //if (this.t == null)

    let x1 = new Date().getTime(),
      y1 = this.t,
      x2 = x1 + this.H * 60 * 1000,
      y2 = this.goal_tT;

    this.curr_tT = new ClassLinearFunction({ x1, y1, x2, y2 });
    this.logger(
      "i",
      `Time: from ${new Date(x1).toLocaleString()} to ${new Date(
        x2
      ).toLocaleString()}, 
       Temperature: from ${y1}C to ${y2}C:: 
       Created function: k=${this.curr_tT.k};a=${this.curr_tT.a};`
    );
    this.logger(
      "i",
      `errTmin=${this.errTmin}C;errTmax=${this.errTmax}C;H=${this.H}min;errH=${this.errH}min;Y=${this.Y}min;`
    );
    this.testProcess();

    await super.start();
  } //start()

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess()::";

    if (this.state._id === "going") {
      // не можна запускати зміну цільової температури до моменту
      // виконна beforeStart(), бо в прилад запрограмується поточна
      // задана температура, а не цільова

      // поточний час
      let now = new Date().getTime();

      // поточна цільова температура
      this.tT = parseInt(this.curr_tT.get(now));
      // щоб при перевищенні часу нагрівання, температура не виходила за межі цільвої - обмежуємо
      this.tT = this.tT > this.goal_tT ? this.goal_tT : this.tT;

      // отримуємо та виконуємо загальні перевірки поточної температури
      if (!(await super.testProcess())) {
        trace ? log("i", ln, `testProcess stoped`) : null;
        return;
      }
      trace
        ? this.logger(
            "",
            `current tT=${this.tT}; current t=${this.t}; duration = ${this.state.duration}`
          )
        : null;

      // перевіряємо поточну температура на вхід в зону витримки
      let temp = `t=${this.t}*C;`;
      let dur = this.state.duration;
      if (this.t > this.goal_tT + this.goalErrTmin * 0.8) {
        let msg = {
          ua: `Нагрівання успішно завершено: ${temp}< (tT - 0.8*errTmin). Тривалість:  ${dur}`,
          en: `Heating finished: ${temp}< (tT - 0.8*errTmin). Duration: ${dur}`,
          ru: `Нагрев завершен: ${temp}< (tT - 0.8*errTmin). Длительность: ${dur}`,
        };
        this.logger("w", msg.en);
        this.finish(msg);
      }

      // якщо вказана похибка часу розігріву, перевіряємо чи не сплив час
      if (this.errH != 0) {
        if (this.currentDuration > (this.H + this.errH) * 60 * 1000) {
          let msg = {
            ua: `Перевищено час розігрівання: ${dur}; ${temp}`,
            en: `Heating time is up:  ${dur}; ${temp}`,
            ru: `Превышено время разогрева:  ${dur}; ${temp}`,
          };
          this.logger("e", msg.en);
          this.error(msg);
        }
      }
    } //if (this.state._id === "going"){
    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
  } //testProcess()
}

module.exports = ClassHeatingStep;

if (!module.parent) {
  let item = new ClassHeatingStep({
    tT: 500,
    getT: function () {
      console.dir(this);
    },
  });

  console.dir(item);

  console.log("======== this = ========");
  item.getT();
}
