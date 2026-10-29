const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");
const { dummyPromise } = require("../../tools/dummy.js");

const GO_ATTEMPTS = 3;
const GO_RETRY_MS = 3000;

/**
 * Крок переходу TRM-251 на наступну програму.
 * У програмі стоїть між останнім кроком однієї програми і першим кроком наступної.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_nextProgram extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_nextProgram";

  /**
   * @param {Object} props
   * @property {Number} props.prgN - номер програми, на яку переходимо
   * @property {async Function} [props.goToNextProgram] - перехід на програму; інакше device.continueFrom
   * @property {Object} [props.device] - менеджер приладу TRM-251
   */
  constructor(props = {}) {
    props.header =
      props.header && props.header.ua
        ? props.header
        : {
            ua: `Наступна програма ${props.prgN}`,
            en: `Next program ${props.prgN}`,
            ru: `Следующая программа ${props.prgN}`,
          };
    super(props);
    this.state.type = "ProsessStep_SimpleBadge";
    this.prgN = props.prgN;
    this.device = props.device == undefined ? null : props.device;

    if (typeof props.goToNextProgram === "function") {
      this.goToNextProgram = props.goToNextProgram;
    } else if (typeof (this.device && this.device.continueFrom) !== "function") {
      throw new Error(
        this.ln +
          "Критична помилка: немає props.goToNextProgram і props.device.continueFrom. Крок зупинено.",
      );
    }

    this.beforeStart = async () => {
      let lastError;
      for (let attempt = 1; attempt <= GO_ATTEMPTS; attempt++) {
        try {
          await this.goToNextProgram({ prgN: this.prgN, stepN: 1 });
          this.finish({
            ua: `Перехід на програму ${this.prgN}, крок 1`,
            en: `Moved to program ${this.prgN}, step 1`,
            ru: `Переход на программу ${this.prgN}, шаг 1`,
          });
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
   * Переходить на програму prgN, крок stepN.
   * continueFrom менеджера читає prN і stN.
   * @param {{prgN: number, stepN: number}} arg
   */
  async goToNextProgram({ prgN, stepN } = {}) {
    return this.device.continueFrom({ prN: prgN, stN: stepN });
  }

  /**
   * Створює крок. Виклик: ClassStep_TRM251_nextProgram.getStep(props).
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_nextProgram}
   */
  static getStep(props) {
    return new ClassStep_TRM251_nextProgram(props);
  }

  /**
   * Фабрика для StepsManager.
   * @param {Object} props налаштування кроку
   * @returns {ClassStep_TRM251_nextProgram}
   */
  static createStep(props) {
    return ClassStep_TRM251_nextProgram.getStep(props);
  }
}

module.exports = ClassStep_TRM251_nextProgram;
