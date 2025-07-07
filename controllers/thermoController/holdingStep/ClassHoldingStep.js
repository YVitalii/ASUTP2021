const ClassThermoStepGeneral = require("../ClassThermoStepGeneral.js");
const log = require("../../../tools/log");

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
    // props.ln = props.ln ? props.ln : "ClassHoldingStep::";
    props.id = props.id ? props.id : "holding";
    props.ln = props.ln ? props.ln : props.id;
    let trace = 0,
      ln = props.id + "::constructor():: beforeSuper()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    super(props);

    if (trace) {
      log("i", ln, `after super() this=`);
      console.dir(this);
    }
    //this.ln = this.device.header.en + "::" + this.ln + "::";
    ln = this.ln + "constructor()::";

    // ---- час нагрівання (для програмування приладу),
    // =0 так як це витримка і піч вже розігріта

    this.H = 0;

    // --- час витримки, хв

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
      ua: `${this.device.header.ua}.Витримка ${tT}`,
      en: `${this.device.header.en}.Holding  ${tT}`,
      ru: `${this.device.header.ru}.Удержание ${tT}`,
    };
    this.header = {
      ua: `= ${tT}`,
      en: `= ${tT}`,
      ru: `= ${tT}`,
    };

    // -------
    // помилка часу витримки = 15 хв, щоб всі зони встигли закінчити витримку
    // інакше перша зона в якої закінчилась витримка вимкне нагрівання та почне охолоджуватись
    // щоб в прилади записалось потрібне значення, додаємо його до завдання

    this.errY = this.Y==0 ? 0 : 15; // при витримці Y=0, врахування помилки не потрібно
    this.Y += this.errY;
    // заголовок для логування
    this.ln += `tT=${this.tT}(${this.errTmin}/+${this.errTmax}); Y=${
      this.Y - this.errY
    }+${this.errY}::`;

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
    let trace = 1,
      ln = "testProcess()::";
    let now = new Date().getTime();

    if (!(await super.testProcess())) {
      trace ? log("i", ln, `testProcess stoped`) : null;
      return;
    }
    if (this.t != null) {
      let info = `t=${this.t}*C; ${this.state.duration}`;
      if (this.Y != 0 && this.currentDuration > (this.Y - this.errY) * 60) {
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
