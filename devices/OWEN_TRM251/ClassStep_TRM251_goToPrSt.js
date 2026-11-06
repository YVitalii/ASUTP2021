const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");
const { dummyPromise } = require("../../tools/dummy.js");

const GO_ATTEMPTS = 3;
const GO_RETRY_MS = 3000;

/**
 * Крок переходу TRM-251 на програму prN і крок stN.
 * У програмі стоїть між останнім кроком однієї програми і першим кроком наступної.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_goToPrSt extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_goToPrSt";

  /**
   * @param {Object} props
   * @property {Object} props.device менеджер приладу TRM-251
   * @property {Number} props.prN номер програми
   * @property {Number} props.stN номер кроку
   */
  constructor(props = {}) {
    if (props.device == null || props.prN == null || props.stN == null) {
      throw new Error(
        "ClassStep_TRM251_goToPrSt: потрібні device, prN і stN",
      );
    }
    const prN = props.prN;
    const stN = props.stN;
    props.header = {
      ua: `Перехід Пр:${prN} Кр:${stN}`,
      en: `Go to Pr:${prN} St:${stN}`,
      ru: `Переход Пр:${prN} Шг:${stN}`,
    };
    props.comment = {
      ua: `Перехід на Пр:${prN} Кр:${stN}`,
      en: `Moving to Pr:${prN} St:${stN}`,
      ru: `Переход на Пр:${prN} Шг:${stN}`,
    };
    super(props);
    this.state.type = "ProsessStep_SimpleBadge";
    this.prN = prN;
    this.stN = stN;
    this.device = props.device;

    this.beforeStart = async () => {
      let lastError;
      for (let attempt = 1; attempt <= GO_ATTEMPTS; attempt++) {
        try {
          await this.device.continueFrom({ prN: this.prN, stN: this.stN });
          this.finish();
          return;
        } catch (error) {
          lastError = error;
          this.logger("w", {
            ua: `Спроба ${attempt} з ${GO_ATTEMPTS} не вдалась`,
            en: `Attempt ${attempt} of ${GO_ATTEMPTS} failed`,
            ru: `Попытка ${attempt} из ${GO_ATTEMPTS} не удалась`,
          });
          if (attempt < GO_ATTEMPTS) await dummyPromise(GO_RETRY_MS);
        }
      }
      this.error(lastError);
      throw lastError;
    };
  }

  /**
   * Створює крок. Виклик: ClassStep_TRM251_goToPrSt.getStep(props).
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_goToPrSt}
   */
  static getStep(props) {
    return new ClassStep_TRM251_goToPrSt(props);
  }

  /**
   * Фабрика для StepsManager.
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_goToPrSt}
   */
  static createStep(props) {
    return ClassStep_TRM251_goToPrSt.getStep(props);
  }
}

module.exports = ClassStep_TRM251_goToPrSt;
