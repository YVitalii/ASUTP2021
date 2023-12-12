const log = require("../../../../tools/log.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;
const ClassStep = require("./ClassStep.js");
/** Загальний клас кроку термічної програми, оcновна логіка та основні параметри */
class ClassThermoStep extends ClassStep {
  /**
   * Конструктор класу, оптимізованого під нагрівання
   * @param {*} props
   * @property {}
   */
  constructor(props = {}) {
    super(props);
    let trace = 1;

    let ln = this.ln + "Constructor()::";

    trace ? log("i", ln, `props=`, props) : null;

    // задана температура
    this.regs.tT = {
      id: "tT",
      type: "number",
      value: undefined,
      header: "T,°C",
      title: {
        ua: `Цільова температура, °С`,
        en: `Task temperature, °С`,
        ru: `Заданная температура, °С`,
      },
      min: undefined,
      max: undefined,
    };

    this.regs.tT.value = props.tT
      ? props.tT
      : (function () {
          throw new Error("tT must be defined! tT=" + props.tT);
        })();

    // мінімальне відхилення температури від розрахункової
    this.regs.errTmin = {
      id: "errTmin",
      header: "errTmin",
      type: "number",
      value: props.errTmin ? props.errTmin : -50,
      title: {
        ua: `Максимальне відхилення температури вниз,°С`,
        en: `Limit of low temperature,°С`,
        ru: `Максимальное отклонение температуры вниз,°С`,
      },
      min: 0,
      max: -100,
    };
    // максимальне відхилення температури від розрахункової
    this.regs.errTmax = {
      id: "errTmax",
      header: "errTmax",
      type: "number",
      value: props.errTmin ? props.errTmin : +25,
      title: {
        ua: `Максимальне перевищення температури,°С`,
        en: `Limit of high temperature,°С`,
        ru: `Максимальное превышение температуры,°С`,
      },
      min: 0,
      max: +100,
    };

    //this.regs.errT = props.errT ? props.errT : { min: -25, max: +25 };
    //  закон регулювання
    this.regs.regMode = {
      id: "regMode",
      header: "regMode",
      type: "select",
      value: ["pid"], // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      title: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    };
    // ПІД коеф. інтегрування
    this.regs.pid_ti = {
      id: "pid_ti",
      header: "ti",
      type: "number",
      value: props.pid_ti ? props.pid_ti : 0,
      title: {
        ua: `Інтегральна складова`,
        en: `the Integral gain`,
        ru: `Интегральная составляющая`,
      },
      min: 0,
      max: +1000,
    };
    // ПІД коеф. диференціювання
    this.regs.pid_td = {
      id: "pid_td",
      header: "td",
      type: "number",
      value: props.pid_td ? props.pid_td : 0,
      title: {
        ua: `Диференційна складова`,
        en: `the derivative gain`,
        ru: `Дифферинциальная составляющая`,
      },
      min: 0,
      max: +1000,
    };
    // ПІД коеф. Підсилення
    this.regs.pid_o = {
      id: "pid_td",
      header: "td",
      type: "number",
      value: props.pid_td ? props.pid_td : 0,
      title: {
        ua: `Диференційна складова`,
        en: `the derivative gain`,
        ru: `Дифферинциальная составляющая`,
      },
      min: 0,
      max: +1000,
    };

    // поточна тривалість процесу
    this.processTime = 0;

    // поточна температура процесу
    this.currT = undefined;

    // сек, період опитування поточної температури, по замовчуванню кожні 2 сек
    this.periodCheckT = props.periodCheckT ? props.periodCheckT : 2;

    // асинхронна функція для отримання поточної температури
    if (typeof props.getT != "function") {
      throw new Error(
        "props.getT must be a function, but received: " + typeof props.getT
      );
    }

    this.getT = props.getT;

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } // constructor

  logger(level, msg) {
    log(level, this.ln, "[", new Date().toLocaleTimeString() + "]::" + msg);
  }

  /**
   *
   * @returns true - якщо перевіряти далі, false - якщо процес завершено
   */
  async testProcess() {
    let trace = 1,
      ln =
        "ClassThermoStep()::testProcess(" +
        new Date().toLocaleTimeString() +
        ")::";
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
    this.processTime = (new Date().getTime() - this.startTime) / 1000;

    try {
      // запит температури
      this.currT = await this.getT();
      trace
        ? log("", ln, `t=${this.currT}°C; Process time:${this.processTime}s`)
        : null;
    } catch (error) {
      this.logger(
        "e",
        ln + `Error when try execute function this.getT():` + error.message
      );
      console.dir(error);
      return true;
      // на випадок помилки зв'язку не викидаємо помилку, а очікуємо відновлення
    }
    return true;
  } //async testProcess()
}
ClassThermoStep.regs = ClassStep.regs;
ClassThermoStep.regs.tT = {
  id: "tT",
  type: "number",
  value: 0,
  header: "T,°C",
  title: {
    ua: `Цільова температура, °С`,
    en: `Task temperature, °С`,
    ru: `Заданная температура, °С`,
  },
  min: 20,
  max: 200,
};
module.exports = ClassThermoStep;
