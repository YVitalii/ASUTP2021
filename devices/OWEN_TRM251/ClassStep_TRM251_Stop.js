const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");

/**
 * Крок зупинки TRM-251.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_Stop extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_Stop";

  /**
   * @param {Object} props
   * @property {Object} props.device менеджер приладу TRM-251
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

    this.beforeStart = async () => {
      let res;
      try {
        res = await this.device.stop();
      } catch (error) {
        this.error(error);
        throw error;
      }
      if (res !== true) {
        this.error(res);
        throw res;
      }
      this.finish({
        ua: "Зупинено",
        en: "Stopped",
        ru: "Остановлено",
      });
    };
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
