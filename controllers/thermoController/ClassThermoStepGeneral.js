const ClassStepGeneral = require("../ClassStep/ClassStepGeneral");
const log = require("../../tools/log");
/**
 * Реалізує загальні для всіх кроків термообробки функції
 */
class ClassThermoStepGeneral extends ClassStepGeneral {
  /**
   *
   * @param {Object} props
   * @property {Number} props.regs.tT - *С, цільова температура
   * @property {Number} props.regs.errTmin=-50 - *С, (<0) =0 вимкнуто, нижня границя коридору температури
   * @property {Number} props.regs.errTmax=50 - *С, (>0) =0 вимкнуто, верхня границя коридору температури
   * @property {String} props.regs.regMode="pid"- "pos" / "pid" закон регулювання температури
   * @property {Number} props.regs.o=0 -  для regMode="pid" - постійна складова, для regMode="pos" неузгодження температури
   * @property {Number} props.regs.ti=0 - для regMode="pid" - інтегральний коєф-т, для regMode="pos" немає значення
   * @property {Number} props.regs.td=0 - для regMode="pid" - пропорційний коєф-т, для regMode="pos" немає значення
   * @property {async Function} props.getT - async функція запиту поточної температури
   * @property {async Function} props.checkPeriod=5 - сек, період між опитуваннями поточної температури
   * @property {Object} props.device - обєкт приладу, що має async функції start(regs), addT() та getT
   */

  constructor(props = {}) {
    props.ln = props.ln ? props.ln : props.header.ua + "::";
    let trace = 0,
      ln = props.ln + "constructor()";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    super(props);

    this.header = {
      ua: `ClassThermoStepGeneral`,
      en: `ClassThermoStepGeneral`,
      ru: `ClassThermoStepGeneral`,
    };

    // сутність прилад для поточного кроку
    this.device = props.device;
    if (typeof this.device.getT != "function") {
      throw new Error(this.ln + " typeof this.device.getT != 'function'!");
    }
    if (typeof this.device.start != "function") {
      throw new Error(this.ln + " typeof this.device.start != 'function'!");
    }

    // цільова температура + добавка для конкретного приладу, щоб не було помилки виходу за межі допуст.границі
    if (!props.regs.tT) {
      throw new Error(this.ln + "  must be (tT != 0) and  (tT != undefined)!");
    }
    this.tT = parseInt(props.regs.tT) + this.device.getAddT();

    // для ідентифікації поточного приладу додаємо в повідомлення його id
    this.ln = this.device.id + "::";

    // поточна температура
    this.t = null;

    // --------- temperature limits --------
    this.errTmin =
      props.regs.errTmin ||
      (props.regs.errTmin == 0 && !isNaN(props.regs.errTmin))
        ? props.regs.errTmin
        : -50;
    this.errTmax =
      props.regs.errTmax ||
      (props.regs.errTmax == 0 && !isNaN(props.regs.errTmax))
        ? props.regs.errTmax
        : 50;

    // --------- regulation  --------
    this.regMode =
      props.regs.regMode &&
      (props.regs.regMode == "pos" || props.regs.regMode == "pid")
        ? props.regs.regMode
        : function () {
            this.logger(
              "e",
              this.ln +
                `constructor()::Error: regMode=${props.regs.regMode} was setted "pid"`
            );
            return "pid";
          }.bind(this)();
    this.o = props.regs.o || props.regs.o == 0 ? props.regs.o : 2;
    this.ti = props.regs.ti || props.regs.ti == 0 ? props.regs.ti : 0;
    this.td = props.regs.td || props.regs.td == 0 ? props.regs.td : 0;

    // Функція отримання поточної температури
    this.getT = async () => {
      let t = await this.device.getT();
      if (t == undefined || isNaN(parseInt(t))) {
        t = null;
      }
      this.t = t;
      return t;
    }; //props.getT.bind(this);

    // Функція для запуску приладу
    this.beforeStart = async () => {
      log("", this.ln + "beforeStart()::Started");
      await this.device.start(this);
      log("", this.ln + "beforeStart()::Completed");
      // запускаємо контроль кроку після виконання beforeStart()
      // інакше при відсутності звязку крок піде але параметри задані не будуть
      this.testProcess();
    };

    // Період між опитуваннями
    this.checkPeriod = parseInt(props.checkPeriod ? props.checkPeriod : 5);
  }

  /** функція виконує такі дії
   * 1. Оновлює поточну температуру
   * 2. Перевіряє температуру на відповідність границям: tT+dTmin..tT+dTmax
   * @return true - якщо все Ок та false якщо щось трапилося
   */
  async testProcess() {
    let trace = 0,
      ln = "ClassThermoStepGeneral()::testProcess::";

    trace ? this.logger("i", ln + `Started`) : null;
    // якщо процесс в стані: очікування, зупинки, помилки, кінця - виходимо
    if (
      this.state._id == "stoped" ||
      this.state._id == "finished" ||
      this.state._id == "error"
    ) {
      return false;
    }
    if (this.state._id == "waiting") return true;
    // оновлюємо поточну тривалість процесу
    this.duration();
    try {
      // запит температури
      this.t = await this.getT();
      trace = 0;
      trace
        ? console.log(
            "",
            ln,
            `t=${this.t}°C; Process time:${this.state.duration}`
          )
        : null;
    } catch (error) {
      this.logger(
        "e",
        ln + `Error when try execute function this.getT():` + error.message
      );
      this.t = null;
      console.dir(error);
      // на випадок помилки зв'язку не викидаємо помилку, а очікуємо відновлення
      return true;
    }
    this.t = isNaN(this.t) ? null : this.t;
    return this.checkTemperatureRange();
  } //async testProcess()

  checkTemperatureRange() {
    // TODO Додати перевірку на перевищення максимальної температури в печі

    // якщо поточна температура невідома - вихід
    if (this.t == null) {
      return true;
    }
    // ---------- нижня границя ---------------
    if (this.errTmin != 0) {
      // нижня границя не вимкнена
      if (this.t < this.tT + 2 * this.errTmin) {
        // температура вдвічі нижче мінімуму - помилка
        let data = `t=${this.t} < (${this.tT} + 2*${this.errTmin}) = ${
          this.tT + 2 * this.errTmin
        }`;
        let msg = {
          ua: `Критично низька температура ${data}`,
          en: `Critical low temperature ${data}`,
          ru: `Критически низкая температура ${data}`,
        };
        this.logger("e", msg.ua);
        this.error(msg);
        return false;
      }
      if (this.t < this.tT + this.errTmin) {
        // температура вдвічі нижче мінімуму - помилка
        let data = `t=${this.t} < (${this.tT} ${this.errTmin}) = ${
          this.tT + this.errTmin
        }`;
        let msg = {
          ua: `Низька температура ${data}`,
          en: `Low temperature ${data}`,
          ru: `Низкая температура ${data}`,
        };
        this.logger("w", msg.ua);
        return true;
      }
    } // if (this.errTmin != 0)

    // ---------- верхня границя ---------------
    if (this.errTmax != 0) {
      // верхня границя не вимкнена
      if (this.t > this.tT + 2 * this.errTmax) {
        // температура вдвічі вище максимуму - помилка
        let data = `t=${this.t} < (${this.tT} + 2*${this.errTmax}) = ${
          this.tT + 2 * this.errTmax
        }`;
        let msg = {
          ua: `Критично висока температура ${data}`,
          en: `Critical high temperature ${data}`,
          ru: `Критически высокая температура ${data}`,
        };
        this.logger("e", msg.ua);
        this.error(msg);
        return false;
      }
      if (this.t > this.tT + this.errTmax) {
        // температура вдвічі вище максимуму - помилка
        let data = `t=${this.t} < (${this.tT} + ${this.errTmax}) = ${
          this.tT + this.errTmax
        }`;
        let msg = {
          ua: `Висока температура ${data}`,
          en: `High temperature ${data}`,
          ru: `Высокая температура ${data}`,
        };
        this.logger("w", msg.ua);
        return true;
      }
    } // if (this.errTmax != 0)

    return true;
  } //checkTemperatureRange()
} //ClassThermoStepGeneral

module.exports = ClassThermoStepGeneral;

if (!module.parent) {
  let item = new ClassThermoStepGeneral({
    tT: 500,
    getT: function () {
      console.dir(this);
    },
  });

  console.dir(item);

  console.log("======== this = ========");
  item.getT();
}
