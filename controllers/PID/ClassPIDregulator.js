const log = require("../../tools/log");
const ClassGeneral = require("../../ClassGeneral");
const LinearFunction = require("../../tools/general").ClassLinearFunction;

function inRange(x, range = { min: 0, max: 100 }) {
  if (x < range.min || x > range.max) {
    // console.error(`x=${x} is out of range`);
    if (x < range.min) return range.min;
    if (x > range.max) return range.max;
  }
  return x;
}

class PID extends ClassGeneral {
  /**
   * Creates an instance of the PID regulator.
   *
   * @constructor
   * @param {Object} [params={}] - The params for the PID regulator.
   * @param {Object} [params.inputRange={min: 0, max: 100}] - The input range for normalization.
   * @param {number} [params.inputRange.min=0] - The minimum input value.
   * @param {number} [params.inputRange.max=100] - The maximum input value.
   * @param {Object} [params.outputRange={min: 0, max: 100}] - The output range for normalization.
   * @param {number} [params.outputRange.min=0] - The minimum output value.
   * @param {number} [params.outputRange.max=100] - The maximum output value.
   * @param {number} [params.kp=0] - The proportional gain.
   * @param {number} [params.ki=0] - The integral gain.
   * @param {number} params.kiError=0 - величина помилки PV, при якій інтегральна складова не рахується
   * @param {number} [params.kd=0] - The derivative gain.
   * @param {number} [params.setPoint=0] - The desired set point.
   * @param {number} [params.period=1000] - ms, period between calculation
   * @param {async Function} params.getPV - async функція для отримання поточного Process Value
   * @param {async Function} params.setOutput - async функція для встановлення поточної потужності
   *
   */

  constructor(params = {}) {
    params.ln ? params.ln : "PIDregulator::";
    super(params);
    this.manual = false; //
    this.realSetPoint = 0; //  цільова точка в одиницях процесу (не переведена в %)
    this.period = params.period ? params.period * 1000 : 1000; //ms
    this.inputRange = params.inputRange
      ? params.inputRange
      : { min: 0, max: 100 };
    this.normalizeInput = new LinearFunction({
      x1: this.inputRange.min,
      y1: 0,
      x2: this.inputRange.max,
      y2: 100,
    });
    this.outputRange = params.outputRange
      ? params.outputRange
      : { min: 0, max: 100 };
    this.normalizeOutput = new LinearFunction({
      x1: this.outputRange.min,
      y1: 0,
      x2: this.outputRange.max,
      y2: 100,
    });
    if (!params.getPV && typeof params.getPV !== "function")
      throw new Error("getPV() function is not defined");
    this.getPV = params.getPV;

    if (!params.setOutput && typeof params.setOutput !== "function")
      throw new Error("setOutput() function is not defined");
    this.setOutput = params.setOutput;

    this._processValue = 0;
    this._kp = params.kp ? params.kp : 0;
    this._ki = params.ki ? params.ki : 0;
    this._kd = params.kd ? params.kd : 0;
    this._setPoint = 0; // нормалізована цільова точка (%)
    this._error = 0;
    this._errorPrev = 0;
    this._errorSum = 0;
    this._output = 0;
    // величина помилки, при якій інтегральна складова не враховується
    this.kiError = this.normalizeInput.get(params.kiError ? params.kiError : 0);
  }

  start(setPoint = undefined) {
    if (setPoint != undefined) {
      this.setPoint = setPoint;
    }
    log(
      "i",
      this.ln +
        "start()::" +
        `kp=${this.kp}, ki=${this.ki}, kd=${this.kd}, setPoint=${this.setPoint}`
    );
    this.errorPrev = 0;
    this.errorSum = 0;
    this.going = 1;
    this.startTime = new Date().getTime();
    this.calculate();
  }

  stop() {
    this.going = 0;
    return;
  }

  async calculate() {
    let trace = 1,
      ln = this.ln + `calculate()::`;
    if (this.going == 0) {
      await this.setOutput(0);
      return;
    }
    // console.log("Started");
    // console.log("T=" + this.getPV());
    // let input = 1;
    let input = await this.getPV();
    let msg = `T=${this.input.toFixed(2)};`;
    if (this.manual) return this.output;
    input = this.normalizeInput.get(input);
    this.error = this.setPoint - input;
    msg += ` SP=${this.setPoint} → PV=${input.toFixed(
      2
    )}; error=${this.error.toFixed(2)};`;
    if (Math.abs(this.error) > this.kiError) {
      this.errorSum = 0;
    } else {
      this.errorSum += this.error;
    }
    if (this.error > this.kiError * 1.5) {
      this.output = 100;
      trace ? log("", ln, msg, ` output=${this.output}; `) : null;
    } else {
      let qp = this.kp * this.error;
      let qi = this.ki * this.errorSum;
      let qd = this.kd * (this.error - this.errorPrev);
      this.output = qp + qi + qd;
      this.errorPrev = this.error;
      this.output = inRange(this.output, this.outputRange);
      trace
        ? log(
            "",
            ln,
            msg,
            ` errorSum=${this.errorSum.toFixed(
              2
            )}; output=${this.output.toFixed(2)} = ${qp.toFixed(
              2
            )}p + ${qi.toFixed(2)}i + ${qd.toFixed(2)}d`
          )
        : null;
    }

    await this.setOutput(this.normalizeOutput.get(this.output));

    setTimeout(() => {
      this.calculate();
    }, this.period);
    return this.normalizeOutput.get(this.output);
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
  get setPoint() {
    return this._setPoint;
  }
  set setPoint(value) {
    this._setPoint = inRange(this.normalizeInput.get(value), this.inputRange);
    this.realSetPoint = value;
  }

  /**
   * Повертає стан регулятора (робота/очікування)
   * @returns {value:Boolean, note:{ua,en,ru}}
   */
  getState() {
    return {
      value: this.going,
      note: this.going
        ? { ua: `Робота`, en: `Working`, ru: `Работа` }
        : { ua: `Очікування`, en: `Waiting`, ru: `Ожидание` },
    };
  }
}

module.exports = PID;
