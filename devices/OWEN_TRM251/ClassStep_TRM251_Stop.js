const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");

/** Timeout, offline або закритий порт: лінія ще може повернутися. */
function isLinkGap(error) {
  const text = [
    error && error.message,
    error && error.ua,
    error && error.msg && error.msg.ua,
    error && error.msg && error.msg.en,
  ]
    .filter(Boolean)
    .join(" ");
  return /timeout|device offline|порт не відкрит|port not opened/i.test(text);
}

function readValue(field) {
  if (field !== null && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
}

/**
 * Останній крок програми TRM-251.
 * mode читається через device.getRegisterDirectly("mode"), без кешу.
 * mode 0 — прилад уже зупинений, крок завершується.
 * mode 1 — надсилає device.stop() і далі чекає режим 0, 2, 3 або 4..7.
 * mode 3 — програму виконано. mode 2 — помилка. mode 4..7 — автоналаштування.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_Stop extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_Stop";

  /**
   * @param {Object} props
   * @property {Object} props.device менеджер приладу TRM-251
   * @property {Number} [props.checkPeriod=5] період опитування, с
   */
  constructor(props = {}) {
    if (props.device == null) {
      throw new Error("ClassStep_TRM251_Stop: потрібен device");
    }
    props.header = {
      ua: "Стоп",
      en: "Stop",
      ru: "Стоп",
    };
    super(props);
    this.state.type = "ProsessStep_SimpleBadge";
    this.device = props.device;
    this.checkPeriod = Number.isFinite(props.checkPeriod) ? props.checkPeriod : 5;
    this.beforeStart = () => this.poll();
    this.testProcess = () => this.poll();
  }

  /** Наступне читання режиму. */
  waitMore() {
    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
  }

  /**
   * mode 0 завершує крок. mode 1 зупиняє прилад і чекає далі.
   * mode 3 — програму виконано. mode 2 — помилка. mode 4..7 — автоналаштування.
   * @returns {Promise<boolean>} true, коли крок завершено як виконаний
   */
  async poll() {
    if (this.state._id !== "going") return false;

    let res;
    try {
      res = await this.device.getRegisterDirectly("mode");
    } catch (error) {
      if (this.state._id !== "going") return false;
      if (isLinkGap(error)) {
        this.state.note = {
          ua: `Немає відповіді приладу, очікування зв'язку`,
          en: `No device reply, waiting for the link`,
          ru: `Нет ответа прибора, ожидание связи`,
        };
        this.setChanged();
        this.logger("w", this.state.note);
        this.waitMore();
        return false;
      }
      this.error(error);
      return false;
    }
    if (res == null || this.state._id !== "going") return false;

    const mode = Number(readValue(res));
    if (mode === 0) {
      this.finish();
      return true;
    }
    if (mode === 1) {
      try {
        await this.device.stop();
      } catch (error) {
        if (this.state._id !== "going") return false;
        if (isLinkGap(error)) {
          this.state.note = {
            ua: `Немає відповіді приладу, очікування зв'язку`,
            en: `No device reply, waiting for the link`,
            ru: `Нет ответа прибора, ожидание связи`,
          };
          this.setChanged();
          this.logger("w", this.state.note);
          this.waitMore();
          return false;
        }
        this.error(error);
        return false;
      }
      if (this.state._id !== "going") return false;
      this.waitMore();
      return false;
    }
    if (mode === 3) {
      this.finish({
        ua: `Програму завершено`,
        en: `Program completed`,
        ru: `Программу завершено`,
      });
      return true;
    }
    if (mode === 2) {
      this.error({
        ua: `Режим роботи пристрою: Помилка`,
        en: `Device working mode: Error`,
        ru: `Режим работы прибора: Ошибка`,
      });
      return false;
    }
    if (mode === 4 || mode === 5 || mode === 6 || mode === 7) {
      this.stop({
        ua: `Режим роботи пристрою: mode=${mode}`,
        en: `Device working mode: mode=${mode}`,
        ru: `Режим работы прибора: mode=${mode}`,
      });
      return false;
    }

    this.waitMore();
    return false;
  }

  /**
   * Створює крок. Виклик: ClassStep_TRM251_Stop.getStep(props).
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Stop}
   */
  static getStep(props) {
    return new ClassStep_TRM251_Stop(props);
  }

  /**
   * Фабрика для StepsManager.
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Stop}
   */
  static createStep(props) {
    return ClassStep_TRM251_Stop.getStep(props);
  }
}

module.exports = ClassStep_TRM251_Stop;
