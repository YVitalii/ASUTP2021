/**
 * Класс имитирующий физическую печь
 */

// ------------ логгер  --------------------
const log = require("../../tools/log.js");
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null

// температура окружающей среды
var ambientT = 20;

var {
  getLinearRelation,
  getParabolicRelation,
} = require("../../tools/functions.js");

class Furnace {
  #heaters;
  #furnace;
  /**
   * Конструктор класса
   * @param {object} [options={}] список настроечных параметров печи/зоны
   * @param {number} [options.heatersPow=35] мощность нагревателей печи/зоны, кВт
   * @param {number} [options.heatersWeight=11] вес нагревателей, кг
   * @param {number} [options.furnaceWeight=100] вес футеровки, кг
   * @param {number} [options.furnaceMaxT=400] °С, максимальная температура печи
   * @param {number} [options.furnaceMaxLoss=20] %, макс. потери печи в окр.среду при макс.температуре
   */
  constructor(options = {}) {
    let kNoise = 1 + Math.floor(Math.random() * 50) / 100;
    //
    options.heatersPow = options.heatersPow ? options.heatersPow : 35;
    options.heatersWeight = options.heatersWeight ? options.heatersWeight : 11;
    options.furnaceWeight = options.furnaceWeight
      ? options.furnaceWeight
      : 100 * kNoise;
    options.furnaceMaxT = options.furnaceMaxT ? options.furnaceMaxT : 400;
    options.furnaceMaxLoss = options.furnaceMaxLoss
      ? options.furnaceMaxLoss / 100
      : 0.15 * kNoise;
    log("i", "Created model of furnace:");
    console.dir(options);
    /** параметры нагревателей */
    this.#heaters = {
      currPow: 0, // текущая мощность нагревателей 0..1 (задается терморегулятором)
      pow: options.heatersPow,
      weight: options.heatersWeight,
      c: getLinearRelation(0, 0.519, 1300, 0.708), // теплоемкость в зависимости от Т, кДж/(кг*°C)
      heatingK: getParabolicRelation(1300, 50, 20, 300), // разница температур нагр. и окр.ср., при которой отдается 100% мощности нагревателей
      t: ambientT, // текущая температура нагревателей
    };
    /** Параметры печи */
    this.#furnace = {
      weight: options.furnaceWeight,
      c: getLinearRelation(0, 0.825, 1300, 1.214), // кДж/(кг*°C) по шамоту
      t: ambientT, // текущая температура в печи
      lossing: getParabolicRelation(
        options.furnaceMaxT,
        options.furnaceMaxLoss * this.#heaters.pow,
        20,
        0
      ), // потери печи в окруж.среду options.furnaceMaxLoss при Т=options.furnaceMaxT и 0% при Токр.ср.
    };

    /** текущее время  */
    this.currTime = new Date();

    //log("i", "this.#heaters=", this.#heaters);
    // запускаем периодический пересчет модели
    setInterval(() => {
      this.#iterate();
    }, 2000);
  } //constructor(

  #iterate() {
    let q = this.#heating();
    q = this.#furnaceHeat(q);
    this.currTime = new Date();
  } // iterate()

  /** функция включения нагревателей на p%. Выключено = 0, полность включено р=1 или 100% */
  heat(p) {
    if ((p > 100) | (p < 0)) {
      throw new Error("value of current power too high p=" + p.toFixed(2));
    }

    p = p / 100;

    if (this.#heaters.currPow != p) {
      log("w", "Power of heaters:", 100 * p.toFixed(0) + "%");
      this.#heaters.currPow = p;
    }
  } // heat( p )

  getT() {
    return this.#furnace.t;
  }

  #furnaceHeat(q) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "heat():";
    let trace = 0;
    let c = this.#furnace.c(this.#furnace.t);
    let powerLoss = this.#furnace.lossing(this.#furnace.t);
    let dT = (q - powerLoss) / (this.#furnace.weight * c);
    this.#furnace.t += dT;
    trace
      ? log(
          "i",
          "furnaceHeat(" + q.toFixed(1) + "кДж)==>",
          "; dT=" + dT.toFixed(1),
          "; furnace.t=" + this.#furnace.t.toFixed(1),
          "; heaters.t=" + this.#heaters.t.toFixed(1),
          "; powerLoss=" + powerLoss.toFixed(1),
          " с=" + c.toFixed(1) + "кДж/(кг*°С)"
        )
      : null;
  }

  #heating() {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "heat():";
    let trace = 0;
    //trace ? log("i", logN, "Started") : null;

    let now = new Date();
    let dTime = (now.getTime() - this.currTime.getTime()) / 1000;
    // процент мощности, отдаваемый нагревателями в печь
    let k = 0;
    // расчитываем разницу температур при которой
    // отдается 100% энергии нагревателей в печь
    let dQt = this.#heaters.heatingK(this.#furnace.t);
    // энергия, полученная из сети, кДж
    let q = this.#heaters.currPow * this.#heaters.pow * dTime;
    // прирост температуры нагревателей, °C
    let dT = q / (this.#heaters.c(this.#heaters.t) * this.#heaters.weight);
    this.#heaters.t += dT;
    // расчитываем разницу температур нагревателей и печи
    let dTfh = this.#heaters.t - this.#furnace.t;
    if (dTfh <= 0.5) {
      k = 0;
      this.#heaters.t = this.#furnace.t;
    } else {
      if (dTfh >= dQt) {
        // вся энергия идет в печь
        k = 1;
      } else {
        // расчитываем процент мощности, отданный нагревателями в печь
        k = dTfh / dQt + 0.05;
        k = k > 1 ? 1 : k;
      } //if (dTfh >= dQt)
    } //if (dThf <= 0)
    // расчитываем  энергию, отданную в печь
    let Qf = k * this.#heaters.pow * dTime;
    // вычитаем энергию переданную в печь из нагревателей
    let dTf =
      Qf / (this.#heaters.c(this.#heaters.t - dT) * this.#heaters.weight);
    this.#heaters.t -= dTf;

    trace
      ? log(
          "i",
          "heating(" + now.toLocaleTimeString() + ")==>",
          "dTime=" + dTime.toFixed(1) + "sek;",
          "; q=" + q.toFixed(1) + "кДж",
          "; dT=" + dT.toFixed(1),
          "; dTfh=" + dTfh.toFixed(1),
          "; dQt=" + dQt.toFixed(1),
          "; k=" + k.toFixed(2),
          "; Qf=" + Qf.toFixed(1),
          "; dTf=" + dTf.toFixed(2),
          "; heaters.t=" + this.#heaters.t.toFixed(1)
        )
      : null;
    // возвращаем значение энергии переданную в печь
    return Qf;
  } //heat()
} //class Furnace

module.exports = Furnace;

if (!module.parent) {
  let f = new Furnace({ heatersPow: 85 });
  //f.start();
  console.dir(f, { depth: 3 });

  // setInterval(() => {
  //   f.heat();
  // }, 1000);
  setTimeout(() => {
    f.heat(100);
  }, 3000);
  setTimeout(() => {
    f.heat(0);
  }, 55000);
}
