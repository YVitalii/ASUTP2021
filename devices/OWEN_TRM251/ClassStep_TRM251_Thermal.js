const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");
const ClassThermalTaskSimple = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermalSimple.js");

/**
 * Число з регістра: або саме число, або об'єкт {value}.
 */
function readValue(field) {
  if (field !== null && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
}

/**
 * Крок програми TRM-251.
 * Крок уже містить Pr і St. Регістри tT, H, Y беруться з ClassTaskThermalSimple.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_Thermal extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251stepThermal";

  /**
   * @param {Object} props
   * @property {Number} props.Pr - номер програми, уже стоїть на кроці
   * @property {Number} props.St - номер кроку, уже стоїть на кроці
   * @property {Number} props.tT - цільова температура, °C
   * @property {Number|String} props.H - час нагрівання, хв або "ГГ:ХХ"
   * @property {Number|String} props.Y - час витримки, хв або "ГГ:ХХ"
   * @property {Number} [props.maxT=120] - верхня межа tT
   * @property {Number} [props.checkPeriod=5] - період опитування, с
   * @property {Object} [props.device] - менеджер приладу TRM-251
   * @property {async Function} [props.getState] - стан приладу, якщо менеджера немає
   */
  constructor(props = {}) {
    props.header =
      props.header && props.header.ua
        ? props.header
        : {
            ua: `Пр${props.Pr} Крок${props.St}`,
            en: `Pr${props.Pr} Step${props.St}`,
            ru: `Пр${props.Pr} Шаг${props.St}`,
          };
    super(props);

    if (props.device == undefined) {
      this.device = null;
      if (typeof props.getState !== "function") {
        throw new Error(
          this.ln +
            "Критична помилка: немає props.device і props.getState. Крок зупинено.",
        );
      }
      this.getState = props.getState;
    } else {
      this.device = props.device;
      const readState = props.device.getCurrentState;
      if (readState == undefined || typeof readState !== "function") {
        throw new Error(
          this.ln +
            "Критична помилка: props.device.getCurrentState має бути функцією. Крок зупинено.",
        );
      }
    }

    if (
      !Number.isFinite(Number(props.Pr)) ||
      !Number.isFinite(Number(props.St))
    ) {
      throw new Error(this.ln + "step must already contain Pr and St");
    }

    const template = new ClassThermalTaskSimple({
      maxT: Number.isFinite(props.maxT) ? props.maxT : 120,
      tT: props.tT,
      H: props.H,
      Y: props.Y,
    });
    this.regs = {
      tT: template.regs.tT,
      H: template.regs.H,
      Y: template.regs.Y,
    };
    this.goal = {
      Pr: Number(props.Pr),
      St: Number(props.St),
      tT: this.regs.tT.value,
      H: this.regs.H.value,
      Y: this.regs.Y.value,
    };

    this.checkPeriod = Number.isFinite(props.checkPeriod)
      ? props.checkPeriod
      : 5;
    // ClassStepGeneral.start() кличе beforeStart. beforeAll з завдання — цей гачок.
    this.beforeStart = () => this.beforeAll();
    this.testProcess = () => this.poll();
  }

  /**
   * Запит поточного стану приладу через менеджер.
   * Якщо менеджера немає, у конструкторі this.getState замінюється на props.getState.
   */
  getState() {
    return this.device.getCurrentState();
  }

  /**
   * Створює крок. Виклик: ClassStep_TRM251_Thermal.getStep(props).
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Thermal}
   */
  static getStep(props) {
    return new ClassStep_TRM251_Thermal(props);
  }

  /**
   * Фабрика для StepsManager: тип кроку "TRM251stepThermal".
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Thermal}
   */
  static createStep(props) {
    return ClassStep_TRM251_Thermal.getStep(props);
  }

  async beforeAll() {
    this.testProcess();
  }

  /**
   * Поки прилад стоїть на цільових Pr/St — крок ще триває.
   * Коли програма або крок змінились, або режим «Завершено» — крок виконано.
   * @returns {Promise<boolean>} false — крок ще триває або вже зупинений
   */
  async poll() {
    if (this.state._id !== "going") return false;

    let res;
    try {
      res = await this.getState();
    } catch (error) {
      if (this.state._id === "going") this.error(error);
      return false;
    }
    if (!res || this.state._id !== "going") return false;

    const mode = Number(readValue(res.mode));
    // менеджер віддає programN і step, тест і опис кроку — Pr і St
    const pr = readValue(res.Pr != null ? res.Pr : res.programN);
    const st = readValue(res.St != null ? res.St : res.step);

    if (mode === 0) {
      this.stop({
        ua: `Зупинено користувачем`,
        en: `Stopped by user`,
        ru: `Остановлено пользователем`,
      });
      return false;
    }
    if (mode === 2) {
      this.error({
        ua: `Аварія!`,
        en: `Alarm!`,
        ru: `Авария!`,
      });
      return false;
    }
    if (mode === 4 || mode === 5 || mode === 6 || mode === 7) {
      this.error({
        ua: `Йде автоналаштування!`,
        en: `Autotuning is running!`,
        ru: `Идет автонастройка!`,
      });
      return false;
    }
    if (mode === 3 || pr != this.goal.Pr || st != this.goal.St) {
      this.finish({
        ua: `Крок виконано успішно`,
        en: `Step finished successfully`,
        ru: `Шаг выполнен успешно`,
      });
      return true;
    }

    setTimeout(() => this.testProcess(), this.checkPeriod * 1000);
    return false;
  }
}

module.exports = ClassStep_TRM251_Thermal;
