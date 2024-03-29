/* -------------- симулятор драйвера прибора ТРП-08ТП --------------

  function getReg(iface,id,regName,cb) - (err,data) где data -  массив объектов
  function setReg(iface,id,regName,value,cb) - (err,data) где data -  объект
  function has(regName)

  cb (err,
      data:[{
           regName:
           value:,
           note:,
           req: буфер запроса,
           buf: буффер ответа ,
           timestamp:},...],
           )
*/
// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;
// trace ? log("i",logN,"--- ---") : null;
// trace ? console.dir() : null;

const Device = require("./simulator_deviceClass.js");

/**
 * Возвращает отформатированные данные
 * @prop {Object} opt входные данные для формирования ответа
 * @prop {String} opt.regName имя регистра например "tT"
 * @prop {Number} opt.value значение регистра
 */
function getData(opt) {
  return [
    {
      regName: opt.regName,
      value: opt.value,
      note: "Simulation",
      req: Buffer.from("Simulate"),
      buf: Buffer.from("Simulate"),
    },
  ];
}

class Simulator {
  #device;
  #regs;
  /**
   * Конструктор симулятора драйвера терморегулятора
   * @param {object} [options] см. конструктор класса: /devices/ .. /simulator_deviceClass.js;список настроечных параметров печи/зоны;
   * @param {number} [options.currT=ambientT] % текущая температура печи/зоны, начинаем с 20 °С
   * @param {number} [options.mode=0] регулирование: 1 - включено; 0 -выключено
   * @param {number} [options.H=300] время нарастания температуры, сек
   * @param {number} [options.Y=300] время удержания температуры, сек
   * @param {number} [options.o=2] рассогласование температуры
   * @param {number} [options.ogr=9] ограничение температуры  ogr x 50°C
   * @param {string} [options.state="waiting"] текущий режим работы прибора
   * @param {number} [options.taskT=50*(ogr-1)] заданная целевая температура процесса
   * @param {object} [options.furnace={}] см. конструктор класса: furnaceModel/simulator.js; список настроечных параметров печи/зоны;
   * @param {number} [options.furnace.heatersPow=35] мощность нагревателей печи/зоны, кВт
   * @param {number} [options.furnace.heatersWeight=11] вес нагревателей, кг
   * @param {number} [options.furnace.furnaceWeight=100] вес футеровки, кг
   * @param {number} [options.furnace.furnaceMaxT=400] °С, максимальная температура печи
   * @param {number} [options.furnace.furnaceMaxLoss=20] %, макс. потери печи в окр.среду при макс.температуре
   */
  constructor(options) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "constructor:";
    let trace = 0;
    trace = gTrace != 0 ? gTrace : trace;
    trace ? log("w", logN, "-----> Started. opt=", opt) : null;

    this.#device = new Device(options);
    this.#regs = new Set(["state", "T", "tT", "H", "Y", "o"]);
    trace ? log("i", "----- this.#regs= -----") : null;
    trace ? console.dir(this.#regs) : null;
  }

  has(regName) {
    return this.#regs.has(regName.trim());
  }

  setReg(iface, id, regName, value, cb) {
    // ---- получаем данные -----------
    let answer = this.#answer(true, regName.trim(), value);
    //  ---  готовим ответ -----------
    let data = getData({
      regName: regName,
      value: answer,
    });
    process.nextTick(function () {
      cb(null, data);
    });
    return;
  } //setReg(iface, id, regName, value, cb)

  getReg(iface, id, regName, cb) {
    // ---- получаем данные -----------
    let answer = this.#answer(false, regName.trim());
    //  ---  готовим ответ -----------
    let data = getData({
      regName: regName,
      value: answer,
    });
    process.nextTick(function () {
      cb(null, data);
    });
    return;
  } //getReg(iface,id,regName,cb)
  #answer(setMode, regName, value = null) {
    let answer = null;
    switch (regName.trim()) {
      case "state":
        if (setMode) {
          this.#device.mode = value;
        }
        answer = this.#device.mode;
        break;
      case "T":
        answer = this.#device.T;
        break;
      case "tT":
        if (setMode) {
          this.#device.taskT = value;
        }
        answer = this.#device.taskT;
        break;
      case "H":
        if (setMode) {
          this.#device.H = value;
        }
        answer = this.#device.H;
        break;
      case "Y":
        if (setMode) {
          this.#device.Y = value;
        }
        answer = this.#device.Y;
        break;
      case "o":
        if (setMode) {
          this.#device.o = value;
        }
        answer = this.#device.o;
        break;
      default:
        break;
    }
    return answer;
  } //function answer(set=false,regName,value=null)
} // class

module.exports = Simulator;

if (!module.parent) {
  let opt = { regName: "tT", value: 250 };
  log("w", "getData(" + JSON.stringify(opt) + ")=");
  console.dir(getData(opt));
}
