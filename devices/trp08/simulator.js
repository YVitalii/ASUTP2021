const Err = require("../../tools/apiError.js");
const log = require("../../tools/log.js");
// ------------ логгер  --------------------
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null

/**
 * температура окружающей среды
 * @type {number} ambientT=20
 */
var ambientT = 20;

/**
 * период итераций, сек
 * @type {number}
 */
var iterationTime = 2;

class TRP08 {
  /**
   * Конструктор класса
   * @param {object} [options] список настроечных параметров печи/зоны
   * @param {number} [options.pow=30] мощность печи/зоны, кВт
   * @param {number} [options.kLoss=20] % потерь в окружающую среду, потери = pow*kLoss, кВт
   * @param {number} [options.currT=ambientT] % текущая температура печи/зоны, начинаем с 20 °С
   * @param {number} [options.furnaceC=options.pow] теплолемкость печи с садкой, кДж/°С
   * @param {number} [options.mode=0] регулирование: 1 - включено; 0 -выключено
   * @param {number} [options.taskT=options.maxT] заданная целевая температура процесса
   * @param {number} [options.H=300] время нарастания температуры, сек
   * @param {number} [options.Y=300] время удержания температуры, сек
   * @param {number} [options.o=2] рассогласование температуры
   * @param {number} [options.ogr=9] ограничение температуры  ogr x 50°C
   * @param {string} [options.state="waiting"] состояние процесса: "startWaiting" / "waiting" / "startHeating" /"heating" / "startHolding" / "holding"
   * @param {number} [options.=]
   * @param {number} [options.=]
   * @param {number} [options.=]
   * @param {number} [options.=]
   */
  constructor(options) {
    if (!options) {
      options = {};
    }

    this.pow = options.pow ? options.pow : 30;
    this.kLoss = options.kLoss ? options.kLoss : 20;
    this.currT = options.currT ? options.currT : ambientT;
    this.furnaceC = options.furnaceC ? options.furnaceC : this.pow;
    this.mode = 0;
    this.H = options.H ? options.H : 5 * 60;
    this.Y = options.Y ? options.Y : 1 * 60;
    this.o = options.o ? options.o : 2;
    this.ogr = options["ogr"] ? options["ogr"] : 9;
    this.maxT = this.ogr * 50;
    this.taskT = options.taskT ? options.taskT : this.maxT - 50;
    /**
     * хранит состояние процесса: "waiting" / "heating" / "holding"]
     * @type {string} state="waiting"
     */
    this.state = "waiting";
    /**
     * хранит параметры процесса разогрева
     * @type {object}
     * @param {Date} heatingState.start начало процесса
     * @param {Date} heatingState.end планируемое окончание процесса
     * @param {Date} heatingState.dT расчетный прирост температуры °C/сек
     */
    this.heatingState = {
      start: null, // засекаем старт процесса
      end: null, // планируемое окончание процесса
      dT: 0,
    }; // heatingState

    /**
     * хранит параметры процесса выдержки (holding)
     * @type {object}
     * @param {Date} holdingState.start начало процесса
     * @param {Date} holdingState.end планируемое окончание процесса
     * @param {Date} holdingState.dT гистерезис регулирования °C
     */
    this.holdingState = {
      start: null,
      end: null,
      dT: 0,
    }; // holdingState

    /**
     * текущее время процесса
     * @type {Date}
     */
    this.currTime = new Date();
    /**
     * текущее задание температуры, изменяется в процессе регулирования и разогрева
     * @type {number}
     */
    this.currTaskT = this.currT;
    // запускаем цикл обработки
    this.iterate();
  } // constructor

  // --------------------  taskT  -------------------------
  get taskT() {
    return this._taskT;
  }
  set taskT(taskT) {
    log("w", "Change: taskT from ", this._taskT, " to ", taskT, " .");
    this._taskT = Math.round(taskT);
    if (this.state === "heating") {
      this.state = "startHeating";
    }
  }

  // --------------------  H  -------------------------
  get H() {
    return this._H;
  }

  set H(H) {
    log("w", "Change: heating time from ", this._H, " to ", H, " .");
    if (H >= (99 * 60 + 59) * 60) {
      log("e", "Heating time is too long: ", H, " sek. Stop process.");
      this.state = "startWaiting";
      return;
    }
    if (H < 0) {
      H = 0;
    }
    this._H = Math.round(H);
    if (this.state === "heating") {
      this.state = "startHeating";
    }
  }

  // --------------------  Y  -------------------------
  get Y() {
    return this._Y;
  }
  set Y(Y) {
    log("w", "Change holding time from ", this.Y, " to ", Y, " .");
    if (Y >= (99 * 60 + 59) * 60) {
      log("e", "Holding time is too long: ", Y, " sek. Stop process.");
      this.state = "startWaiting";
      return;
    }
    Y = Y < 0 ? 0 : Y;
    this._Y = Math.round(Y);
    if (this.state === "holding") {
      this.state = "startHolding";
    }
  }

  // --------------------  o  -------------------------
  get o() {
    return this._o;
  }
  set o(o) {
    log("w", "Change K proportionality from ", this.o, " to ", o, " .");
    if (o > 100) {
      log("e", "K proportionality is too hight: ", o, ".");
      o = 100;
      return;
    }
    o = o < 2 ? 2 : o;
    this._o = o;
  }

  // --------------------  mode  -------------------------
  get mode() {
    return this._mode;
  }
  set mode(mode) {
    log("w", "Change mode from ", this.mode, " to ", mode, " .");
    if (mode >= 1) {
      this.state = "startHeating";
      mode = 1;
    } else {
      this.state = "startWaiting";
      mode = 0;
    }
    this._mode = mode;
  }

  // --------------------  ogr  -------------------------
  get ogr() {
    return this._ogr;
  }
  set ogr(ogr) {
    this._ogr = parseInt(ogr);
    this.maxT = this.ogr * 50;
  }

  /**
   * обновляет текущую температуру и текущее время в соответствии с состоянием печи
   * @param {Date} now отметка времени
   */
  heat(now) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "heat(" + now.toTimeString().slice(0, 8) + "):";
    let trace = 1;
    trace = gTrace != 0 ? gTrace : trace;
    // -----------
    let dTime = (now.getTime() - this.currTime.getTime()) / 1000; // отрезок времени, сек
    let k = (this.currT - ambientT) / (this.maxT - ambientT); // коэф. учитыв. разницу температур печи и окр.среды.
    let q = -k * (this.kLoss / 100) * this.pow * dTime; // энергия потерь в окр.среду
    if (this.currT > this.maxT) {
      // превышение максимальной температуры
      this.mode = 0;
      log(
        "e",
        "Warning: current temperature is too high: this.currT=" +
          this.currT +
          "; this.maxT=this.maxT"
      );
    }
    if (this.currT < this.currTaskT) {
      // греем
      q += this.pow * dTime;
      //trace ? log("i", logN, "after heating: q=", q.toFixed(2)) : null;
    }
    let dT = q / this.furnaceC;
    this.currT += dT;
    this.currTime = now;
    trace
      ? log(
          "i",
          logN,
          "  state='" + this.state + "'",
          "; currT = " + this.currT.toFixed(1) + "°C",
          "; this.currTaskT=" + this.currTaskT.toFixed(1) + "°C",
          "; q=" + q.toFixed(1) + "кДж",
          "; dT= " + dT.toFixed(2) + "°C",
          "; taskT= " + this.taskT + "°C"
        )
      : null;
  } // heating

  startHeating() {
    // инициализация состояния "нагрев"
    let now = new Date();
    this.mode = 1;
    this.state = "heating";
    this.heatingState.start = now;
    this.heatingState.end = new Date(
      now.getTime() + new Date(this.H * 1000).getTime()
    );
    this.heatingState.dT = (this.taskT - this.currT) / this.H;
    log(
      "w",
      "startHeating ==>",
      " time:" + this.H + "sek;",
      " T: " + this.currT + "->" + this.taskT + "°C;",
      " from:" + this.heatingState.start.toLocaleTimeString(),
      " to " + this.heatingState.end.toLocaleTimeString(),
      "; dT=" + this.heatingState.dT.toFixed(2)
    );
  } //startHeating()
  // ghj
  //let i=1;
  heating() {
    // засекаем время
    let now = new Date();
    // ----------- настройки логгера локальные --------------
    let logN = logName + "heating(" + now.toLocaleTimeString() + "):";
    let trace = 1;
    trace = gTrace != 0 ? gTrace : trace;
    //trace ? log("i", logN, "Started") : null;
    let period = (now.getTime() - this.currTime.getTime()) / 1000;
    if (this.currTime >= this.heatingState.end) {
      // время для нагрева закончилось
      trace
        ? log(
            "w",
            logN,
            "Время отведенное на разогрев закончилось: heatingState.end=" +
              this.heatingState.end.toLocaleTimeString(),
            "; overtime=" +
              Math.round(
                (now.getTime() - this.heatingState.end.getTime()) / 1000
              )
          )
        : null;
      if (this.currT >= this.currTaskT) {
        this.state = "startHolding";
        this.heatingState.end = now;
        let msg = `Heating finished at ${now.toLocaleTimeString()}`;
        log("w", msg);
        return;
      }
    } else {
      let taskT = this.currTaskT + this.heatingState.dT * period;
      this.currTaskT = taskT >= this.taskT ? this.taskT : taskT;
      //trace ? log("i", logN, "currTaskT=", this.currTaskT) : null;
    }
    // греем
    this.heat(now);
  } // heating()

  startHolding() {
    // начало цикла выдержки
    this.state = "holding";
    this.holdingState.start = new Date();
    this.holdingState.end = new Date(
      this.holdingState.start.getTime() + this.H * 1000
    );
    this.holdingState.dT = 0;
    this.currTaskT = this.taskT;
    log(
      "w",
      "Start holding at " + this.holdingState.start.toLocaleTimeString(),
      "; end time: " + this.holdingState.end.toLocaleTimeString()
    );
  }

  holding() {
    // засекаем время
    let now = new Date();
    // ----------- настройки логгера локальные --------------
    let logN = logName + "holding(" + now.toLocaleTimeString() + "):";
    let trace = 1;
    trace = gTrace != 0 ? gTrace : trace;
    //trace ? log("i", logN, "Started") : null;

    if (this.currTime >= this.holdingState.end) {
      // время вышло
      this.state = "startWaiting";
      this.holdingState.end = now;
      return;
    }
    //греем
    this.heat(now);
    if (this.currT >= this.taskT) {
      // текущая температура выше заданной
      // выход
      return;
    }
    if (this.holdingState.dT == 0) {
      this.holdingState.dT = -this.o;
    } else {
      this.holdingState.dT = 0;
    }
    // обновляем текущую задачу
    this.currTaskT = this.taskT + this.holdingState.dT;
  }

  startWaiting() {
    this.mode = 0;
    this.state = "waiting";
    this.currTaskT = ambientT;
    log(
      "w",
      "Start waiting at " + new Date().toLocaleTimeString(),
      "; currT=" + this.currT,
      "; currTaskT=" + this.currTaskT
    );
  } //startWaiting()
  start() {}
  waiting() {
    let now = new Date();
    if (this.currT <= ambientT) {
      return;
    }
    this.heat(now);
  } // waiting()

  iterate() {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "iterate(): this.state=" + this.state + "::";
    let trace = 1;
    trace = gTrace != 0 ? gTrace : trace;
    //trace ? log("i", logN, "Started") : null;

    setTimeout(() => {
      this.iterate();
    }, iterationTime * 1000);

    if (this.state === "waiting") {
      this.waiting();
      return;
    }

    // if (this.mode === 0) {
    //   this.startWaiting();
    //   return;
    // }

    if (this.state === "startWaiting") {
      this.startWaiting();
      return;
    }

    if (this.state === "startHeating") {
      // startHeating()
      this.startHeating();
      return;
    }
    if (this.state === "heating") {
      // startHeating()
      this.heating();
      return;
    }
    if (this.state === "startHolding") {
      // startHeating()
      this.startHolding();
      return;
    }
    if (this.state === "holding") {
      // startHeating()
      this.holding();
      return;
    }
  } // iterate()
} //class TRP08

module.exports = TRP08;

if (!module.parent) {
  let f = new TRP08({
    mode: 0,
    taskT: 40,
    H: 0.5 * 60,
    Y: 0.5 * 60,
    maxT: 80,
  });
  //f.start();
  console.dir(f, { depth: 3 });
  console.log("this.iterate");
  console.dir(f.iterate);
  f.startHeating();
  setTimeout(() => {
    f.taskT = 50;
  }, 10000);

  setTimeout(() => {
    f.taskT = 70;
  }, 50000);
}
