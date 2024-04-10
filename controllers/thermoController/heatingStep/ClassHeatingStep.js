const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");
const parseLinearFunction =
  require("../../../tools/general.js").parseLinearFunction;

class ClassHeatingStep extends ClassThermoStepGeneral {
  /**
   *
   * @param {*} params
   * @property {Number|String} props.H=0 - хв; час нагрівання; 0= макс.швидко;
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
    props.ln = props.ln ? props.ln : "ClassHeatingStep::";

    super(props);
    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }

    this.beforeStart = async () => {
      props.beforeStart(this);
    };

    // ---- час нагрівання ---------
    this.H = props.H ? props.H : 0;

    // цільова температура = tT + 0.8 * errTmin;
    this.goal_tT = this.tT + parseInt(this.errTmin * 0.8);
    // ---- якщо час розігріву не вказано - вимикаємо нижню межу температури
    this.errTmin = this.H == 0 ? 0 : this.errTmin;
    // -- верхню межу температури піднімаємо
    this.errTmax = this.tT + this.errTmax - this.goal_tT;
    // ---- поточна цільова температура -----
    // так як при Н!=0 поточна цільова температура з часом постійно змінюється
    // то запамятовуємо її в окремій змінній, для того щоб контролювати момент завершення кроку
    // на 2024-04-09 не працює лінійна інтерполяція завдання
    //  TODO Зробити контроль поточної цільової температури при Н != 0

    this.curr_tT = {
      k: 0,
      a: this.goal_tT,
    };

    // id
    this.id = "heating";
    // Назва кроку
    let tT = `${this.goal_tT} &deg;C`;
    this.comment = {
      ua: `Шв. нагр. до ${tT}`,
      en: `Quick heating to ${tT}`,
      ru: `Быстрое нагр. до ${tT}`,
    };
    this.header = {
      ua: `->${this.tT}`,
      en: `->${this.tT}`,
      ru: `->${this.tT}`,
    };

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } // constructor

  async start() {
    // визначаємо коєфіцієнти для функції зміни цільової температури
    this.testProcess();
    // let x1 = new Date().getTime(),
    //   y1 = this.t,
    //   x2 = x1 + this.H * 60 * 1000,
    //   y2 = this.goal_tT;
    // let { k, a } = parseLinearFunction({ x1, y1, x2, y2 });
    // this.curr_tT = { k, a };
    // this.logger("i", `x1=${x1};y1=${y1};x2=${x2};y2=${y2}:: k=${k};a=${a};`);
    return await super.start();
  } //start()

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess()::";
    let now = new Date().getTime();
    this.tT = parseInt(now * this.curr_tT.k + this.curr_tT.a);
    trace ? this.logger("i", ln + `Started with current tT=${this.tT}`) : null;
    if (!(await super.testProcess())) {
      trace ? log("i", ln, `testProcess stoped`) : null;
      return;
    }

    if (this.t > this.goal_tT + this.errTmin) {
      let info = `t=${this.t}*C`;
      let msg = {
        ua: `Нагрівання завершено: ${info}`,
        en: `Heating finished: ${info}`,
        ru: `Нагрев завершен: ${info}`,
      };
      this.logger("w", ln + msg.en);
      this.finish(msg);
    }

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
