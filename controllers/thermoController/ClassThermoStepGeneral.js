const ClassStepGeneral = require("../ClassStep/ClassStepGeneral");

/**
 * Реалізує загальні для всіх кроків термообробки функції
 */
class ClassThermoStepGeneral extends ClassStepGeneral {
  /**
   *
   * @param {Object} props
   * @property {Number} props.tT - *С, цільова температура
   * @property {Number} props.errTmin=-50 - *С, (<0) =0 вимкнуто, нижня границя коридору температури
   * @property {Number} props.errTmax=50 - *С, (>0) =0 вимкнуто, верхня границя коридору температури
   * @property {String} props.regMode="pid"- "pos" / "pid" закон регулювання температури
   * @property {Number} props.o=0 -  для regMode="pid" - постійна складова, для regMode="pos" неузгодження температури
   * @property {Number} props.ti=0 - для regMode="pid" - інтегральний коєф-т, для regMode="pos" немає значення
   * @property {Number} props.td=0 - для regMode="pid" - пропорційний коєф-т, для regMode="pos" немає значення
   * @property {async Function} props.getT - async функція запиту поточної температури
   * @property {async Function} props.checkPeriod=5 - сек, період між опитуваннями поточної температури
   *
   */

  constructor(props = {}) {
    props.headers =
      props.headers && props.headers.ua
        ? props.headers
        : {
            ua: `ClassThermoStepGeneral`,
            en: `ClassThermoStepGeneral`,
            ru: `ClassThermoStepGeneral`,
          };
    props.ln = props.ln ? props.ln : props.headers.ua + "::";

    super(props);
    // цільова температура
    if (!props.tT) {
      throw new Error(this.ln + "  must be (tT != 0) and  (tT != undefined)!");
    }
    this.tT = parseInt(props.tT);
    // поточна температура
    this.t = 0;
    // --------- temperature limits --------
    this.errTmin = props.errTmin || props.errTmin == 0 ? props.errTmin : -50;
    this.errTmax = props.errTmax || props.errTmax == 0 ? props.errTmax : 50;
    // --------- regulation  --------
    this.regMode =
      props.regMode && (props.regMode == "pos" || props.regMode == "pid")
        ? props.regMode
        : function () {
            this.logger(
              "e",
              this.ln +
                `constructor()::Error: regMode=${props.regMode} was setted "pid"`
            );
            return "pid";
          }.bind(this)();
    this.o = props.o || props.o == 0 ? props.o : 2;
    this.ti = props.ti || props.ti == 0 ? props.ti : 0;
    this.td = props.td || props.td == 0 ? props.td : 0;

    // Функція отримання поточної температури
    this.getT = props.getT.bind(this);
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
      trace = 1;
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
      console.dir(error);
      // на випадок помилки зв'язку не викидаємо помилку, а очікуємо відновлення
      return true;
    }

    return this.checkTemperatureRange();
  } //async testProcess()

  checkTemperatureRange() {
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
        let data = `t=${this.t} < (${this.tT} + ${this.errTmin}) = ${
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
