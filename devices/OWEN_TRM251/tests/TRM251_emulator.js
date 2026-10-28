/**
 * Емулятор TRM-251 для прогону кроків без приладу.
 * Поки mode не Stop, кожне 5-те читання збільшує крок на 1.
 * Крок більший за 5 переводить прилад у Stop (mode = 0).
 */
class TRM251_emulator {
  constructor() {
    this.Alarm = 0;
    this.prgN = 1;
    this.step = 1;
    this.mode = 0;
    this.requests = 0;
  }

  /**
   * @returns {Promise<{Alarm: number, programN: number, step: number, mode: number}>}
   */
  async getCurrentState() {
    if (this.mode !== 0) {
      // Крок > 5 вже відданий попереднім читанням. Це читання ставить Stop,
      // щоб термокрок встиг завершитись по зміні номера кроку.
      if (this.step > 5) {
        this.mode = 0;
      } else {
        this.requests += 1;
        if (this.requests % 5 === 0) this.step += 1;
      }
    }
    return {
      Alarm: this.Alarm,
      programN: this.prgN,
      step: this.step,
      mode: this.mode,
    };
  }

  /**
   * Ставить програму і крок. prgN/prN і stepN/stN, інакше 1.
   * Лічильник опитувань починається спочатку.
   * @param {{prgN?: number, prN?: number, stepN?: number, stN?: number}} [arg]
   * @returns {Promise<true>}
   */
  async continueFrom(arg = {}) {
    const prgN = arg.prgN != null ? arg.prgN : arg.prN;
    const stepN = arg.stepN != null ? arg.stepN : arg.stN;
    this.prgN = prgN == null ? 1 : prgN;
    this.step = stepN == null ? 1 : stepN;
    this.requests = 0;
    return true;
  }

  /**
   * Ставить prN/stN і запускає прилад: mode = 1.
   * @param {{prN?: number, stN?: number}} [arg]
   * @returns {Promise<true>}
   */
  async start({ prN, stN } = {}) {
    await this.continueFrom({ prgN: prN, stepN: stN });
    this.mode = 1;
    return true;
  }
}

module.exports = TRM251_emulator;
