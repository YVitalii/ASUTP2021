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
  /**
   * @param {Object} props
   * @property {Number} props.Pr - номер програми, уже стоїть на кроці
   * @property {Number} props.St - номер кроку, уже стоїть на кроці
   * @property {Number} props.tT - цільова температура, °C
   * @property {Number|String} props.H - час нагрівання, хв або "ГГ:ХХ"
   * @property {Number|String} props.Y - час витримки, хв або "ГГ:ХХ"
   * @property {Number} [props.maxT=120] - верхня межа tT
   * @property {Number} [props.checkPeriod=5] - період опитування, с
   * @property {async Function} props.getState - повертає {Pr, St, mode}
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

    if (typeof props.getState !== "function") {
      throw new Error(this.ln + "props.getState must be a function");
    }
    const getState = props.getState;

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
    // this.getState() лишається знімком кроку з ClassStepGeneral.
    this.beforeStart = () => this.beforeAll();
    this.testProcess = () => this.poll(getState);
  }

  /**
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Thermal}
   */
  static getStep(props) {
    return new ClassStep_TRM251_Thermal(props);
  }

  async beforeAll() {
    this.testProcess();
  }

  /**
   * Поки прилад стоїть на цільових Pr/St — крок ще триває.
   * Коли програма або крок змінились, або режим «Завершено» — крок виконано.
   * @returns {Promise<boolean>} false — крок ще триває або вже зупинений
   */
  async poll(getState) {
    if (this.state._id !== "going") return false;

    let res;
    try {
      res = await getState();
    } catch (error) {
      if (this.state._id === "going") this.error(error);
      return false;
    }
    if (!res || this.state._id !== "going") return false;

    const mode = Number(readValue(res.mode));
    const pr = readValue(res.Pr);
    const st = readValue(res.St);

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
