const log = require("../../tools/log");
const ClassGeneral = require("../../ClassGeneral");

function inRange(x, range = { min: 0, max: 100 }) {
  if (x < range.min) return range.min;
  if (x > range.max) return range.max;
  return x;
}

/**
 * Позиційний (двопозиційний) регулятор температури з гістерезисом.
 *
 * Поріг увімкнення: SP + dSP.min (за замовчуванням SP − 1)
 * Поріг вимкнення:  SP + dSP.max (за замовчуванням SP)
 *
 * PV <= поріг увімкнення → потужність = maxPower
 * PV >= поріг вимкнення  → потужність = 0
 * між порогами           → попередня позиція (увімкнено / вимкнено)
 */
class POSregulator extends ClassGeneral {
  /**
   * @param {Object} [params={}]
   * @param {string} params.id
   * @param {number} [params.SP=0] - цільова температура (те саме, що setPoint)
   * @param {number} [params.setPoint=0] - цільова температура, псевдонім SP
   * @param {{min:number, max:number}} [params.dSP={min:-1, max:0}] - зона гістерезису відносно SP
   * @param {number} [params.maxPower=100] - потужність увімкненого стану, 0..100
   * @param {boolean} [params.autoCalculate=false] - циклічний розрахунок з періодом params.period
   * @param {number} [params.period=1] - с, період між розрахунками в авторежимі
   * @param {async Function} params.getPV - поточне значення процесу (температура)
   * @param {async Function} params.setOutput - встановити потужність, %
   */
  constructor(params = {}) {
    params.ln = params.ln ? params.ln : "POSregulator::";
    super(params);

    if (typeof params.getPV !== "function")
      throw new Error("getPV() function is not defined");
    if (typeof params.setOutput !== "function")
      throw new Error("setOutput() function is not defined");

    this.getPV = params.getPV;
    this.setOutput = params.setOutput;

    this.period = 1000;
    this.autoCalculate = false;

    this._SP = 0;
    this._dSP = { min: -1, max: 0 };
    this._maxPower = 100;
    this._heating = false;
    this._output = 0;
    this.going = 0;
    this._timer = null;

    this.setParams(params);
  }

  /**
   * Встановлює оперативні уставки, які передані в params.
   * Відсутні поля не змінюються. getPV, setOutput та id ігноруються.
   *
   * @param {Object} [params={}]
   * @param {number} [params.setPoint] - цільова температура
   * @param {number} [params.SP] - цільова температура
   * @param {{min:number, max:number}} [params.dSP]
   * @param {number} [params.maxPower] - 0..100
   * @param {boolean} [params.autoCalculate]
   * @param {number} [params.period] - с, період авторозрахунку
   */
  setParams(params = {}) {
    if (!params || typeof params !== "object") return this;
    const keys = ["SP", "setPoint", "dSP", "maxPower", "autoCalculate", "period"];
    const applied = {};
    for (const key of keys) {
      if (params[key] === undefined) continue;
      if (key === "period")
        this.period = params.period ? Number(params.period) * 1000 : 1000;
      else if (key === "autoCalculate")
        this.autoCalculate = params.autoCalculate === true;
      else this[key] = params[key];
      applied[key] = params[key];
    }
    if (Object.keys(applied).length)
      log("i", this.ln + "setParams()::", applied);
    return this;
  }

  start(SP = undefined) {
    if (SP !== undefined) this.SP = SP;
    this.going = 1;
    this.startTime = new Date().getTime();
    log(
      "i",
      this.ln +
        "start()::" +
        `SP=${this.SP}; dSP.min=${this.dSP.min}; dSP.max=${this.dSP.max}; maxPower=${this.maxPower}; autoCalculate=${this.autoCalculate}`,
    );
    return this.calculate();
  }

  stop() {
    log("i", this.ln + "stop()::Stopping POS regulator");
    this.going = 0;
    this._heating = false;
    this._output = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    return this.setOutput(0);
  }

  async calculate() {
    let ln = this.ln + "calculate()::";

    if (this.going === 0) {
      this._heating = false;
      this._output = 0;
      await this.setOutput(0);
      return 0;
    }

    const pv = Number(await this.getPV());
    if (this.going === 0) {
      this._heating = false;
      this._output = 0;
      await this.setOutput(0);
      return 0;
    }
    if (!Number.isFinite(pv)) {
      throw new Error(ln + `getPV() повернув нечислове значення: ${pv}`);
    }

    const low = this.SP + this.dSP.min;
    const high = this.SP + this.dSP.max;

    if (pv >= high) this._heating = false;
    else if (pv <= low) this._heating = true;

    this._output = this._heating ? this.maxPower : 0;

    if (this.going === 0) {
      this._heating = false;
      this._output = 0;
      await this.setOutput(0);
      return 0;
    }

    await this.setOutput(this._output);

    if (this.autoCalculate && this.going === 1) {
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        this._timer = null;
        this.calculate().catch((err) => {
          log("e", ln, err && err.message ? err.message : err);
        });
      }, this.period);
    }

    return this._output;
  }

  get SP() {
    return this._SP;
  }

  set SP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error("SP must be a finite number");
    this._SP = n;
  }

  get setPoint() {
    return this._SP;
  }

  set setPoint(value) {
    this.SP = value;
  }

  get dSP() {
    return { min: this._dSP.min, max: this._dSP.max };
  }

  set dSP(value) {
    if (!value || typeof value !== "object")
      throw new Error("dSP must be {min, max}");
    const min = value.min !== undefined ? Number(value.min) : this._dSP.min;
    const max = value.max !== undefined ? Number(value.max) : this._dSP.max;
    if (!Number.isFinite(min) || !Number.isFinite(max))
      throw new Error("dSP.min and dSP.max must be finite numbers");
    if (min > max) throw new Error(`dSP.min (${min}) > dSP.max (${max})`);
    this._dSP = { min, max };
  }

  get maxPower() {
    return this._maxPower;
  }

  set maxPower(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error("maxPower must be a finite number");
    this._maxPower = inRange(n, { min: 0, max: 100 });
  }

  get output() {
    return this._output;
  }

  /**
   * @returns {{value:number, SP:number, dSP:{min:number,max:number}, maxPower:number, output:number, heating:boolean, autoCalculate:boolean}}
   */
  getState() {
    return {
      value: this.going,
      note: this.going
        ? { ua: "Робота", en: "Working", ru: "Работа" }
        : { ua: "Очікування", en: "Waiting", ru: "Ожидание" },
      SP: this.SP,
      dSP: this.dSP,
      maxPower: this.maxPower,
      output: this.output,
      heating: this._heating,
      autoCalculate: this.autoCalculate,
    };
  }
}

module.exports = POSregulator;
