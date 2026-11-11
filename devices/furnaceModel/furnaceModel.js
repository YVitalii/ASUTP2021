/**
 * Фізична модель печі (зона): два теплові контури — нагрівачі та футеровка.
 *
 * Симуляція не йде в реальному часі: кожен виклик getT() робить один крок
 * моделі тривалістю period секунд (зручно для тестів і PID).
 *
 * API:
 *   heat(p)  — задати потужність 0…100 %
 *   getT()   — крок симуляції + температура печі, °C
 */

// ------------ логгер  --------------------
const log = require("../../tools/log.js");
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null

/** Температура навколишнього середовища, °C (стартова для нагрівачів і печі). */
var ambientT = 20;

var {
  getLinearRelation,
  getParabolicRelation,
} = require("../../tools/functions.js");

class Furnace {
  /** @type {object} стан і параметри нагрівачів (приватне поле) */
  #heaters;
  /** @type {object} стан і параметри футеровки / камери печі */
  #furnace;

  /**
   * @param {object} [options={}] параметри печі/зони
   * @param {number} [options.heatersPow=35] потужність нагрівачів, кВт
   * @param {number} [options.heatersWeight=11] маса нагрівачів, кг
   * @param {number} [options.furnaceWeight=100] маса футеровки, кг
   * @param {number} [options.furnaceMaxT=400] °C, опорна макс. температура для кривої втрат
   * @param {number} [options.furnaceMaxLoss=20] %, макс. втрати в оточення при furnaceMaxT
   * @param {number} [options.period=5] с, тривалість одного кроку при getT()
   */
  constructor(options = {}) {
    // ------- дефолти (девіації задавати ззовні при створенні) -------
    options.heatersPow = options.heatersPow ? options.heatersPow : 35;
    options.heatersWeight = options.heatersWeight ? options.heatersWeight : 11;
    options.furnaceWeight = options.furnaceWeight ? options.furnaceWeight : 100;
    options.furnaceMaxT = options.furnaceMaxT ? options.furnaceMaxT : 400;
    // furnaceMaxLoss у опціях — %, всередині зберігаємо частку 0…1
    options.furnaceMaxLoss = options.furnaceMaxLoss
      ? options.furnaceMaxLoss / 100
      : 0.2;
    this.period = options.period ? options.period : 5;
    options.period = this.period;
    log("i", "Created model of furnace:");
    console.dir(options);

    /**
     * Нагрівачі: отримують енергію з мережі (currPow × pow),
     * віддають тепло в камеру залежно від ΔT з піччю.
     */
    this.#heaters = {
      currPow: 0, // поточна потужність 0…1 (від heat())
      pow: options.heatersPow, // номінал, кВт
      weight: options.heatersWeight, // кг
      // теплоємність матеріалу нагрівача залежно від T, кДж/(кг·°C)
      c: getLinearRelation(0, 0.519, 1300, 0.708),
      // ΔT(нагр−піч), при якій у піч іде 100% потужності (залежить від T печі)
      heatingK: getParabolicRelation(1300, 50, 20, 300),
      t: ambientT, // °C нагрівачів
    };

    /**
     * Футеровка / об'єм печі: приймає енергію від нагрівачів,
     * втрачає тепло в оточення (lossing).
     */
    this.#furnace = {
      weight: options.furnaceWeight, // кг
      // теплоємність шамоту залежно від T, кДж/(кг·°C)
      c: getLinearRelation(0, 0.825, 1300, 1.214),
      t: ambientT, // °C у печі (те, що повертає getT)
      // втрати, кДж/с (кВт): furnaceMaxLoss×pow при T=furnaceMaxT, ≈0 при ambient
      lossing: getParabolicRelation(
        options.furnaceMaxT,
        options.furnaceMaxLoss * this.#heaters.pow,
        20,
        0
      ),
    };

    /** Симульований час моделі, с (зростає на period після кожного getT). */
    this.currTime = 0;
  }

  /**
   * Один крок симуляції на this.period секунд:
   * 1) нагрів нагрівачів і передача енергії в піч;
   * 2) нагрів/охолодження футеровки з урахуванням втрат.
   */
  #iterate() {
    let q = this.#heating(); // енергія, віддана в піч за крок, кДж
    this.#furnaceHeat(q);
    this.currTime += this.period;
  }

  /**
   * Задати потужність нагрівачів.
   * @param {number} p 0…100 % (0 — вимкнено, 100 — повна потужність)
   */
  heat(p) {
    if (p > 100 || p < 0) {
      throw new Error("value of current power too high p=" + p.toFixed(2));
    }

    p = p / 100; // → 0…1

    if (this.#heaters.currPow != p) {
      log("w", "Power of heaters:", (100 * p).toFixed(0) + "%");
      this.#heaters.currPow = p;
    }
  }

  /**
   * Крок моделі + поточна температура печі.
   * Саме getT() рухає час — без фонового таймера.
   * @returns {number} температура печі, °C
   */
  getT() {
    this.#iterate();
    return this.#furnace.t;
  }

  /**
   * Оновлює температуру футеровки за енергією q від нагрівачів.
   * dT = (Q_вхід − Q_втрати) / (m · c)
   * @param {number} q енергія від нагрівачів за крок, кДж
   */
  #furnaceHeat(q) {
    let logN = logName + "furnaceHeat():";
    let trace = 0;
    let c = this.#furnace.c(this.#furnace.t);
    // lossing(T) дає кВт (= кДж/с); за крок period втрати ≈ lossing × period,
    // але історично в моделі lossing порівнюється з q напряму як енергія кроку
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

  /**
   * Енергія мережі → нагрівачі → частка k у піч.
   * k залежить від ΔT між нагрівачами і піччю (інерція нагрівачів).
   * @returns {number} енергія, віддана в піч за крок, кДж
   */
  #heating() {
    let logN = logName + "heating():";
    let trace = 0;

    let dTime = this.period; // с, тривалість кроку
    let k = 0; // частка потужності, що йде в піч (0…1)

    // ΔT, при якій у піч віддається 100% (залежить від T печі)
    let dQt = this.#heaters.heatingK(this.#furnace.t);

    // енергія з мережі за крок: P(кВт)×τ(с) → кДж
    let q = this.#heaters.currPow * this.#heaters.pow * dTime;

    // нагрів самих нагрівачів від мережі
    let dT = q / (this.#heaters.c(this.#heaters.t) * this.#heaters.weight);
    this.#heaters.t += dT;

    // різниця температур нагрівачі − піч
    let dTfh = this.#heaters.t - this.#furnace.t;
    if (dTfh <= 0.5) {
      // майже теплова рівновага — передачі немає
      k = 0;
      this.#heaters.t = this.#furnace.t;
    } else if (dTfh >= dQt) {
      // великий градієнт — уся доступна потужність у піч
      k = 1;
    } else {
      // проміжний режим: частка пропорційна ΔT / dQt
      k = dTfh / dQt + 0.05;
      k = k > 1 ? 1 : k;
    }

    // енергія в піч за крок
    let Qf = k * this.#heaters.pow * dTime;

    // охолодження нагрівачів на віддану енергію
    let dTf =
      Qf / (this.#heaters.c(this.#heaters.t - dT) * this.#heaters.weight);
    this.#heaters.t -= dTf;

    trace
      ? log(
          "i",
          "heating(t=" + this.currTime.toFixed(0) + "s)==>",
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

    return Qf;
  }
}

module.exports = Furnace;

/** Демо: node ./devices/furnaceModel/furnaceModel.js */
if (!module.parent) {
  let f = new Furnace({ heatersPow: 85, period: 5 });
  console.dir(f, { depth: 3 });
  f.heat(100);
  for (let i = 0; i < 12; i++) {
    let t = f.getT();
    console.log(`t=${f.currTime}s T=${t.toFixed(1)}°C`);
  }
  f.heat(0);
  for (let i = 0; i < 6; i++) {
    let t = f.getT();
    console.log(`cool t=${f.currTime}s T=${t.toFixed(1)}°C`);
  }
}
