const log = require("../../tools/log");
const ClassGeneral = require("../../ClassGeneral");
const LinearFunction = require("../../tools/general").ClassLinearFunction;

function inRange(x, range = { min: 0, max: 100 }) {
  if (x < range.min) return range.min;
  if (x > range.max) return range.max;
  return x;
}

/**
 * ПІД-регулятор.
 * PV і setPoint — у фізичних одиницях (inputRange);
 * всередині розрахунок у шкалі 0…100; на виконавчий механізм — outputRange.
 */
class ClassPIDregulator extends ClassGeneral {
  /**
   * @param {Object} [params={}]
   * @param {Object} [params.inputRange={min:0,max:100}] діапазон PV / setPoint
   * @param {Object} [params.outputRange={min:0,max:100}] діапазон виходу на актуатор
   * @param {number} [params.kp=0]
   * @param {number} [params.ki=0]
   * @param {number} [params.kd=0]
   * @param {number} [params.kiError=0] зона помилки (фіз. од.): поза нею I=0; вище ×1.5 → output 100%
   * @param {number} [params.setPoint=0] завдання у фізичних одиницях
   * @param {number} [params.period=1] період розрахунку, **секунди**
   * @param {Function} params.getPV () => number — поточне PV
   * @param {Function} params.setOutput (u: number) => void — вихід на актуатор
   */
  constructor(params = {}) {
    super(params);
    this.manual = false;
    this.going = 0;
    this._timer = null;

    this.periodSec =
      Number.isFinite(params.period) && params.period > 0 ? params.period : 1;
    this.period = this.periodSec * 1000; // мс для setTimeout

    this.inputRange = params.inputRange
      ? params.inputRange
      : { min: 0, max: 100 };
    // фізичні од. → 0…100
    this.normalizeInput = new LinearFunction({
      x1: this.inputRange.min,
      y1: 0,
      x2: this.inputRange.max,
      y2: 100,
    });

    this.outputRange = params.outputRange
      ? params.outputRange
      : { min: 0, max: 100 };
    // 0…100 (ПІД) → фізичний вихід актуатора
    this.scaleOutput = new LinearFunction({
      x1: 0,
      y1: this.outputRange.min,
      x2: 100,
      y2: this.outputRange.max,
    });

    if (typeof params.getPV !== "function") {
      throw new Error("getPV() function is not defined");
    }
    if (typeof params.setOutput !== "function") {
      throw new Error("setOutput() function is not defined");
    }
    this.getPV = params.getPV;
    this.setOutput = params.setOutput;

    this._kp = params.kp ? params.kp : 0;
    this._ki = params.ki ? params.ki : 0;
    this._kd = params.kd ? params.kd : 0;
    this._setPoint = 0;
    if (params.setPoint != undefined) {
      this.setPoint = params.setPoint;
    }

    this.error = 0;
    this.errorPrev = 0;
    this.errorSum = 0;
    this.output = 0; // 0…100 після розрахунку
    this.qp = 0; // пропорційна складова
    this.qi = 0; // інтегральна
    this.qd = 0; // диференціальна

    // kiError у нормалізованій шкалі 0…100 (з фізичних од.)
    this.kiError = this.normalizeInput.get(
      params.kiError != undefined ? params.kiError : 0
    );
  }

  /**
   * Запуск циклу регулювання.
   * @param {number} [setPoint] завдання у фізичних одиницях
   */
  start(setPoint = undefined) {
    if (setPoint != undefined) {
      this.setPoint = setPoint;
    }
    log(
      "i",
      this.ln +
        "start()::" +
        `kp=${this.kp}, ki=${this.ki}, kd=${this.kd}, setPoint=${this.setPoint}, period=${this.periodSec}s`
    );
    this.errorPrev = 0;
    this.errorSum = 0;
    this.going = 1;
    this.startTime = Date.now();
    this.calculate();
  }

  /** Зупиняє цикл setTimeout. */
  stop() {
    this.going = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    log("i", this.ln + "stop()");
  }

  calculate() {
    let trace = 0,
      ln = this.ln + `calculate()::`;

    if (!this.going) return this.output;
    if (this.manual) return this.output;

    let pv = this.getPV();
    let pvNorm = this.normalizeInput.get(pv);
    let spNorm = this.normalizeInput.get(this.setPoint);
    this.error = spNorm - pvNorm;

    let msg =
      `T=${Number(pv).toFixed(2)}; SP=${this.setPoint} → PV=${pvNorm.toFixed(
        2
      )}; error=${this.error.toFixed(2)};`;

    if (Math.abs(this.error) > this.kiError) {
      this.errorSum = 0;
    } else {
      this.errorSum += this.error;
    }

    let dt = this.periodSec;
    this.qp = this.kp * this.error;
    this.qi = this.ki * this.errorSum;
    this.qd = this.kd * ((this.error - this.errorPrev) / dt);

    if (this.error > this.kiError * 1.5) {
      this.output = 100;
      trace ? log("", ln, msg, ` output=${this.output}; (force)`) : null;
    } else {
      this.output = inRange(this.qp + this.qi + this.qd, { min: 0, max: 100 });
      trace
        ? log(
            "",
            ln,
            msg,
            ` errorSum=${this.errorSum.toFixed(2)}; output=${this.output.toFixed(
              2
            )} = ${this.qp.toFixed(2)}p + ${this.qi.toFixed(2)}i + ${this.qd.toFixed(2)}d`
          )
        : null;
    }

    this.errorPrev = this.error;

    let u = this.scaleOutput.get(this.output);
    this.setOutput(u);

    this._timer = setTimeout(() => {
      this.calculate();
    }, this.period);

    return u;
  }

  get kp() {
    return this._kp;
  }
  set kp(value) {
    this._kp = inRange(value);
  }

  get ki() {
    return this._ki;
  }
  set ki(value) {
    this._ki = inRange(value);
  }

  get kd() {
    return this._kd;
  }
  set kd(value) {
    this._kd = inRange(value);
  }

  /** Завдання у фізичних одиницях (inputRange). */
  get setPoint() {
    return this._setPoint;
  }
  set setPoint(value) {
    this._setPoint = inRange(value, this.inputRange);
  }
}

module.exports = ClassPIDregulator;
// сумісність зі старим ім'ям експорту
module.exports.PID = ClassPIDregulator;
