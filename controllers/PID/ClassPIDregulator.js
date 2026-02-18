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
   * @param {Object} [params.entity] - link to object for regulation (інколи втрачається посилання на об'єкт з якого береться PV та задається Output)
   * @param {Object} [params.inputRange={min: 0, max: 100}] - The input range for normalization.
   * @param {number} [params.inputRange.min=0] - The minimum input value.
   * @param {number} [params.inputRange.max=100] - The maximum input value.
   * @param {Object} [params.outputRange={min: 0, max: 100}] - The output range for normalization.
   * @param {number} [params.outputRange.min=0] - The minimum output value.
   * @param {number} [params.outputRange.max=100] - The maximum output value.
   * @param {number} [params.kp=0] - The proportional gain.
   * @param {number} [params.ki=0] - The integral gain.
   * @param {number} params.kiError=(100/kp)*0.9 - величина помилки PV, при якій інтегральна складова не рахується
   * @param {number} [params.kd=0] - The derivative gain.
   * @param {number} [params.setPoint=0] - The desired set point.
   * @param {number} [params.period=1000] - ms, period between calculation
   * @param {async Function} params.getPV - async функція для отримання поточного Process Value
   * @param {async Function} params.setOutput - async функція для встановлення поточної потужності
   *
   */

  constructor(params = {}) {
    params.ln = params.ln ? params.ln : "PIDregulator::";
    let trace = 0,
      ln = params.ln + `constructor()::`;
    super(params);
    this.entity = typeof params.entity == "object" ? params.entity : null;
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
    // this.normalizeInput.get(params.kiError ? params.kiError : 0);
    this.kiError =
      params.kiError || params.kiError === 0 ? params.kiError : null;
    if (trace) {
      console.log(ln + `this=`);
      console.dir(this);
    }
  } // constructor

  start(setPoint = undefined) {
    if (setPoint != undefined) {
      this.setPoint = setPoint;
    }
    if (this.going) {
      log(
        "e",
        this.ln +
          "PID regulator is already working. But command start received!!",
      );
      return;
    }

    this.errorPrev = 0;
    this.errorSum = 0;
    this.going = 1;
    this.startTime = new Date().getTime();
    if (this.kiError === null)
      // kiError - не вказана взагалі - беремо її  (100 / this.kp) * 0.8
      // наприклад kp=10 →  (100/10)*0.8=8% - отже якщо помилка > 8%, то інтегральна складова починає працювати
      // якщо kp=0 то потрібно працювати тільки
      // з інтегральною складовою - встановлюємо 100% - щоб працювала в усьому діапазоні
      this.kiError = this._kp == 0 ? 100 : (100 / this.kp) * 0.8;
    log(
      "i",
      this.ln +
        "start()::" +
        `kp=${this.kp}, ki=${this.ki}, kd=${this.kd}, realSetPoint = ${
          setPoint ? setPoint : this.realSetPoint
        }; normalizedSetPoint=${this.setPoint}%; kiError=${this.kiError}`,
    );
    this.calculate();
  }

  stop() {
    log("i", this.ln + "stop()::Stopping PID regulator");
    this.going = 0;
    return;
  }

  async calculate() {
    let trace = 0,
      ln = this.ln + `calculate()::`;
    if (this.going === 0) {
      await this.setOutput(0);
      return this.normalizeOutput.get(this.output);
    }

    let input = await this.getPV();
    // trace ? console.log(ln + `input=${input}`) : null;
    let msg = `Treal=${input.toFixed(2)};`;
    if (this.manual) return this.output;

    input = this.normalizeInput.get(input);

    this.error = this.setPoint - input;

    msg += ` SP=${this.setPoint}% → PV=${input.toFixed(
      1,
    )}%; error=${this.error.toFixed(2)};`;

    // обчислення інтегральної складової
    let qi = this.ki * this.errorSum;
    if (Math.abs(this.error) > this.kiError) {
      this.errorSum = 0;
    } else {
      if (qi >= -99 || qi <= 99) {
        this.errorSum += this.error;
      }
    }
    qi = qi < -100 ? -100 : qi > 100 ? 100 : qi; // обмеження інтегральної складової ±100%;

    // обчислення пропорційної складової
    let qp = this.kp * this.error;

    // обчислення диференціальної складової
    let qd = this.kd * (this.error - this.errorPrev);
    // вихідний сигнал
    this.output = qp + qi + qd;

    // перевірка виходу з  діапазону 0..100%
    this.output = inRange(this.output, this.outputRange);
    // збереження попередньої помилки
    this.errorPrev = this.error;
    trace
      ? log(
          "",
          ln,
          msg,
          ` errorSum=${this.errorSum.toFixed(2)}; output=${this.output.toFixed(
            2,
          )} = ${qp.toFixed(2)}p + ${qi.toFixed(2)}i + ${qd.toFixed(2)}d`,
        )
      : null;

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
    console.log(this.ln + `set kp(${value})::this._kp=${this._kp}`);
  }

  get ki() {
    return this._ki;
  }
  set ki(value) {
    this._ki = inRange(value);
    console.log(this.ln + `set ki(${value})::this._ki=${this._ki}`);
  }

  get kd() {
    return this._kd;
  }
  set kd(value) {
    this._kd = inRange(value);
    console.log(this.ln + `set kd(${value})::this._kd=${this._kd}`);
  }

  get setPoint() {
    return this._setPoint;
  }

  set setPoint(value) {
    this._setPoint = inRange(this.normalizeInput.get(value), this.inputRange);
    this.realSetPoint = value;
    console.log(
      this.ln +
        `set setPoint(${value})::realSetPoint=${value}; this._setPoint=${this._setPoint}%`,
    );
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
