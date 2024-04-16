const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");
const parseLinearFunction =
  require("../../../tools/general.js").parseLinearFunction;

class ClassHoldingStep extends ClassThermoStepGeneral {
  /**
   *
   * @param {*} params
   * @property {Number|String} props.Y=0 - хв; час нагрівання; 0= макс.швидко;
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
    props.ln = props.ln ? props.ln : "ClassHoldingStep::";

    props.id = "holing";
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

    // ---- час нагрівання (для програмування приладу), так як це нова програма ---------
    this.H = 0;

    // --- час витримки

    this.Y = props.regs.Y ? parseInt(props.regs.Y) : 0;
    if (isNaN(this.Y)) {
      this.Y = 0;
      log(
        "e",
        `Holding time must be defined! But regs.Y= ${JSON.stringify(
          props.regs.Y
        )}. . Was setted Y=0`
      );
    }

    // Назва кроку
    let tT = `${this.tT}°C`;
    this.comment = {
      ua: `Витримка ${tT}`,
      en: `Holding  ${tT}`,
      ru: `Удержание ${tT}`,
    };
    this.header = {
      ua: `= ${this.tT}°C`,
      en: `= ${this.tT}°C`,
      ru: `= ${this.tT}°C`,
    };
    // --------------------------------
    this.ln = `${this.id}(tT=${this.tT}); Y=${this.Y}::`;

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } // constructor

  async start() {
    this.testProcess();
    this.logger(
      "i",
      `Start(): tT=${this.tT}; errTmin=${this.errTmin}; errTmax=${this.errTmax}; H=${this.H}; Y=${this.Y}`
    );
    return await super.start();
  } //start()

  async testProcess() {
    let trace = 0,
      ln = "testProcess()::";
    let now = new Date().getTime();

    if (!(await super.testProcess())) {
      trace ? log("i", ln, `testProcess stoped`) : null;
      return;
    }
    if (this.t != null) {
      let info = `t=${this.t}*C; ${this.state.duration}`;
      if (this.currentDuration > this.Y * 60) {
        let msg = {
          ua: `Витримка завершена: ${info}`,
          en: `Holding finished: ${info}`,
          ru: `Удержание завершено: ${info}`,
        };
        this.logger("w", ln + msg.en);
        this.finish(msg);
      }
      this.logger("", ln + ` ${info}`);
    } else {
      this.logger("", ln + `this.t == null. Next iteration`);
    }
    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
  } //testProcess()
}

module.exports = ClassHoldingStep;

if (!module.parent) {
  let item = new ClassHoldingStep({
    tT: 500,
    getT: function () {
      console.dir(this);
    },
  });

  console.dir(item);

  console.log("======== this = ========");
  item.getT();
}
