/**
 * Емулятор TRM-251 для прогону кроків без приладу.
 * Поки програма йде, кожне 5-те читання збільшує крок на 1.
 * Крок більший за 5 — режим «Програму виконано» (mode = 3).
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
      // Крок > 5 вже відданий попереднім читанням. Це читання ставить
      // «Програму виконано», щоб термокрок встиг завершитись по зміні номера кроку.
      if (this.step > 5) {
        this.mode = 3;
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

  /**
   * Запам'ятовує програму. Крок запису потім читає її через getRegister.
   * @param {Array} program
   * @returns {Promise<true>}
   */
  async setProgram(program) {
    this.program = program;
    return true;
  }

  /**
   * mode віддає поточне значення, без кроку емулятора і без кешу.
   * @param {string} name
   * @returns {Promise<number|Array>}
   */
  async getRegisterDirectly(name) {
    if (name === "mode") return this.mode;
    if (name === "programN") return this.prgN;
    if (name === "step") return this.step;
    return this.getRegister(name);
  }

  /**
   * Для "program" віддає записані кроки з числом tT і порожній крок-термінатор.
   * @param {string} name
   * @returns {Promise<Array|number>}
   */
  async getRegister(name) {
    if (name !== "program") return 0;
    const body = [];
    const program = Array.isArray(this.program) ? this.program : [];
    for (let index = 1; index < program.length; index++) {
      const step = program[index];
      if (!step || !Number.isFinite(Number(step.tT))) continue;
      body.push({
        tT: Number(step.tT),
        H: Number(step.H),
        Y: Number(step.Y),
      });
    }
    body.push({ tT: 0, H: 0, Y: 0 });
    return [{ id: "program1" }, ...body];
  }

  /**
   * Зупиняє прилад: mode = 0.
   * @returns {Promise<true>}
   */
  async stop() {
    this.mode = 0;
    return true;
  }
}

module.exports = TRM251_emulator;
