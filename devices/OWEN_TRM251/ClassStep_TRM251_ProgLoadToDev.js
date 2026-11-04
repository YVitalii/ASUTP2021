const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");
const { dummyPromise } = require("../../tools/dummy.js");
const ClassStep_TRM251_goToPrSt = require("./ClassStep_TRM251_goToPrSt.js");

const WRITE_ATTEMPTS = 3;
const VERIFY_WAIT_MS = 2000;

function readField(step, name) {
  const reg = step && step.regs && step.regs[name];
  if (reg && reg.value !== undefined && reg.value !== null) return reg.value;
  if (step && step[name] !== undefined && step[name] !== null) return step[name];
  return undefined;
}

/** Кроки, які setProgram реально пише в прилад: без заголовка і без маркера переходу. */
function stepsForDevice(program) {
  const steps = [];
  if (!Array.isArray(program)) return steps;
  for (let index = 1; index < program.length; index++) {
    const step = program[index];
    if (step && step.type === ClassStep_TRM251_goToPrSt.type) continue;
    steps.push({
      tT: Number(readField(step, "tT")),
      H: Number(readField(step, "H")),
      Y: Number(readField(step, "Y")),
    });
  }
  return steps;
}

function stepPoint(step) {
  return {
    tT: Number(readField(step, "tT")),
    H: Number(readField(step, "H")),
    Y: Number(readField(step, "Y")),
  };
}

function samePoint(left, right) {
  return left.tT === right.tT && left.H === right.H && left.Y === right.Y;
}

function emptyPoint(point) {
  return point.tT === 0 && point.H === 0 && point.Y === 0;
}

/**
 * Записані кроки збігаються з прочитаними.
 * Одразу за ними має бути порожній крок — кінець програми.
 * Кроки далі в пам'яті приладу не виконуються, їх не порівнюємо.
 * @param {Array} written
 * @param {Array} readProgram відповідь getRegister("program"): [заголовок, ...кроки]
 */
function programMatches(written, readProgram) {
  if (!Array.isArray(readProgram) || written.length === 0) return false;
  const got = readProgram.slice(1).map(stepPoint);
  if (got.length < written.length) return false;
  for (let index = 0; index < written.length; index++) {
    const point = written[index];
    if (![point.tT, point.H, point.Y].every(Number.isFinite)) return false;
    if (!samePoint(point, got[index])) return false;
  }
  if (got.length > written.length && !emptyPoint(got[written.length])) return false;
  return true;
}

/**
 * Крок запису програми в TRM-251.
 * Пише програму, чекає 2 с, читає її назад і порівнює кроки.
 * Усього три спроби запису і перевірки.
 * @extends ClassStepGeneral
 */
class ClassStep_TRM251_ProgLoadToDev extends ClassStepGeneral {
  /** Ідентифікатор кроку в програмі. */
  static type = "TRM251_ProgLoadToDev";

  /**
   * @param {Object} props
   * @property {Object} props.device менеджер TRM-251: setProgram і getRegister
   * @property {Array} props.program програма для запису: [заголовок, ...кроки]
   */
  constructor(props = {}) {
    props.header =
      props.header && props.header.ua
        ? props.header
        : {
            ua: `Запис програми в прилад`,
            en: `Load program to device`,
            ru: `Запись программы в прибор`,
          };
    super(props);
    this.state.type = "ProsessStep_SimpleBadge";
    this.device = props.device == undefined ? null : props.device;
    this.program = props.program;
    this.waitMs = VERIFY_WAIT_MS;

    if (
      !this.device ||
      typeof this.device.setProgram !== "function" ||
      typeof this.device.getRegister !== "function"
    ) {
      throw new Error(
        this.ln +
          "Критична помилка: props.device має мати setProgram і getRegister. Крок зупинено.",
      );
    }
    if (!Array.isArray(this.program)) {
      throw new Error(
        this.ln + "Критична помилка: props.program має бути масивом. Крок зупинено.",
      );
    }

    this.beforeStart = async () => {
      let lastError;
      for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
        try {
          await this.device.setProgram(this.program);
          await dummyPromise(this.waitMs);
          const read = await this.readProgram();
          if (!programMatches(stepsForDevice(this.program), read)) {
            throw new Error("програма в приладі не збігається із записаною");
          }
          this.finish({
            ua: `Програму записано в прилад`,
            en: `Program loaded to the device`,
            ru: `Программа записана в прибор`,
          });
          return;
        } catch (error) {
          lastError = error;
          this.logger("w", {
            ua: `Спроба ${attempt} з ${WRITE_ATTEMPTS} не вдалась`,
            en: `Attempt ${attempt} of ${WRITE_ATTEMPTS} failed`,
            ru: `Попытка ${attempt} из ${WRITE_ATTEMPTS} не удалась`,
          });
        }
      }
      this.error(lastError);
      throw lastError;
    };
  }

  /**
   * Читає програму з приладу. Скидає кеш регістра program, щоб не порівняти старе значення.
   * @returns {Promise<Array>}
   */
  async readProgram() {
    const reg = this.device.regs && this.device.regs.program;
    if (reg) reg.timestamp = 0;
    return this.device.getRegister("program");
  }

  /**
   * @param {Object} props
   * @returns {ClassStep_TRM251_ProgLoadToDev}
   */
  static getStep(props) {
    return new ClassStep_TRM251_ProgLoadToDev(props);
  }

  /**
   * @param {Object} props
   * @returns {ClassStep_TRM251_ProgLoadToDev}
   */
  static createStep(props) {
    return ClassStep_TRM251_ProgLoadToDev.getStep(props);
  }
}

module.exports = ClassStep_TRM251_ProgLoadToDev;
