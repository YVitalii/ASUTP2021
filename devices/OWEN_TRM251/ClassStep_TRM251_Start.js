const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");

/**
 * Крок пуску TRM-251 з програми prN і кроку stN.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_Start extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_Start";

  /**
   * @param {Object} props
   * @property {Object} props.device менеджер приладу TRM-251
   * @property {Number} props.prN номер програми
   * @property {Number} props.stN номер кроку
   */
  constructor(props = {}) {
    if (props.device == null || props.prN == null || props.stN == null) {
      throw new Error("ClassStep_TRM251_Start: потрібні device, prN і stN");
    }
    const prN = props.prN;
    const stN = props.stN;
    const regs = { prN, stN };
    props.header = {
      ua: `Пуск Пр${regs.prN}; Кр${regs.stN}`,
      en: `Start Pr${regs.prN}; St${regs.stN}`,
      ru: `Пуск Пр${regs.prN}; Шг${regs.stN}`,
    };
    super(props);
    this.state.type = "ProsessStep_SimpleBadge";
    this.regs = regs;
    this.device = props.device;

    this.beforeStart = async () => {
      let res;
      try {
        res = await this.device.start(this.regs);
      } catch (error) {
        this.error(error);
        throw error;
      }
      if (res !== true) {
        this.error(res);
        throw res;
      }
      this.finish();
    };
  }

  /**
   * Створює крок. Виклик: ClassStep_TRM251_Start.getStep(props).
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Start}
   */
  static getStep(props) {
    return new ClassStep_TRM251_Start(props);
  }

  /**
   * Фабрика для StepsManager.
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_Start}
   */
  static createStep(props) {
    return ClassStep_TRM251_Start.getStep(props);
  }
}

module.exports = ClassStep_TRM251_Start;
