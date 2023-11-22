let log = require("../tools/log");
let dummy = require("../tools/dummy").dummyPromise;

class ClassTemperatureEmulator {
  /**
   * Функція емулює зміну температури в печі. Призначена для тестування.
   * @param {*} props
   * @property {Object} props.heating - параметри етапу розігрівання
   * @property {Number} props.heating.tT=200 - *С, задана температура tT
   * @property {Number} props.heating.time=30 - сек, тривалість набору температури tT
   * @property {Object} props.firstWave - параметри першої хвилі перерегулювання
   * @property {Number} props.firstWave.time=10 - сек, тривалість перщої хвилі
   * @property {Object} props.holding - параметри етапу витримки
   * @property {Number} props.holding.dT=5 - *С, межі зміни теператури навколо tT
   * @property {Number} props.holding.time=20 - сек, період коливань
   *
   */
  constructor(props = {}) {
    this.ln = "ClassTemperatureEmulator()::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    this.heating = props.heating
      ? props.heating
      : {
          time: 30, // час нагрівання
          tT: 200, // заздана температура
        };
    this.firstWave = {
      time: 10, // сек, тривалість першої хвилі
    };
    this.holding = {
      dT: 5, // ±*С, амплітуда коливань
      time: 100, // с, період
    };
    this.startTime = undefined;
    this.parabola = {};
    this.sin = undefined;
    this.createParabola();
    this.createSin();

    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }

  async setRegs(regs) {
    log("w", this.ln, "setRegs(" + JSON.stringify(regs) + ")");
    return await dummy();
  }

  async stop() {
    log("w", this.ln, "Device stoped!");
    return await dummy();
  }

  createParabola() {
    let trace = 0,
      ln = this.ln + "createParabola()::";
    //  розраховуємо параметри параболи
    let x1 = 0,
      y1 = 20;
    let x2 = this.heating.time,
      y2 = this.heating.tT;
    let x3 = x2 + this.firstWave.time,
      y3 = this.heating.tT;
    let a =
      (y3 - (x3 * (y2 - y1) + x2 * y1 - x1 * y2) / (x2 - x1)) /
      (x3 * (x3 - x1 - x2) + x1 * x2);
    let b = (y2 - y1) / (x2 - x1) - a * (x1 + x2);
    let c = (x2 * y1 - x1 * y2) / (x2 - x1) + a * x1 * x2;
    trace
      ? log("i", ln, `x1=${x1},y1=${y1},x2=${x2},y2=${y2}, x3=${x3},y3=${y3}`)
      : null;
    this.parabola.a = a;
    this.parabola.b = b;
    this.parabola.c = c;

    this.parabola.y = () => {
      let trace = 0,
        ln = this.ln + "parabola()::";
      let x = (new Date().getTime() - this.startTime) / 1000;
      trace ? log("i", ln, `x=`, x) : null;
      return this.parabola.a * x * x + this.parabola.b * x + this.parabola.c;
    };
    this.y3 = y3;
    this.x3 = x3;
  }

  createSin() {
    this.sin = () => {
      let trace = 0,
        ln = this.ln + "sin()::";
      let x = (new Date().getTime() - this.startTime - this.x3 * 1000) / 1000;
      trace ? log("i", ln, `x=`, x) : null;
      let time = (x / this.holding.time) * 2 * 3.14;
      trace ? log("i", ln, `time=`, time) : null;
      return this.y3 - this.holding.dT * Math.sin(time);
    };
  }

  async start(tT = undefined) {
    this.heating.tT = tT ? tT : this.heating.tT;
    this.startTime = new Date().getTime();
    let trace = 0,
      ln = this.ln + "Started(" + tT + ")::";
    this.createParabola();
    this.createSin();
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  }

  async getT() {
    let trace = 0,
      ln = this.ln + "getT()::";
    await dummy();
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }

    let x = (new Date().getTime() - this.startTime) / 1000;
    if (x >= this.x3) {
      return parseInt(this.sin());
    }

    let t = this.parabola.y();
    return parseInt(t);
  }
}

module.exports = ClassTemperatureEmulator;

if (!module.parent) {
  let t = new ClassTemperatureEmulator();
  t.start(300);
  setInterval(async () => {
    console.log(await t.getT());
  }, 1000);
}
