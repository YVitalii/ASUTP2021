let ClassStep = require("./classStep/ClassStep.js");
const devices = require("../../devices/devices.js");
const Heating = require("../heatingStep/ClassHeatingStep.js");
const Holding = require("../heatingStep/ClassHeatingStep.js");
const dummy = require("../../../../tools/dummy").dummyPromise;
let log = require("../../../../tools/log.js").dummyPromise;
let test = true;

class ClassThermStep extends ClassStep {
  constructor(props) {
    super(props);

    this.devices = props.devices;

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.H = props.H ? props.H : 0;

    // хв, тривалість витримки, якщо 0 = до зупинки вручну
    this.H = props.Y ? props.Y : 0;

    // хв, помилка часу наростання, щоб помітити проблеми з нагріванням
    this.errH = props.errH ? props.errH : 0;

    // функція від taskT, закид першої хвилі перерегулювання
    this.waitT = props.waitT
      ? props.waitT
      : () => {
          return 10;
        };
    // функція від taskT, тривалість першої хвилі перерегулювання
    this.waitH = props.waitH
      ? props.waitH
      : () => {
          return 10;
        };
    // pid  коефіцієнти
    this.pid = props.pid ? props.pid : {};
    this.pid.o = this.pid.o ? this.pid.o : 0;
    this.pid.td = this.pid.td ? this.pid.td : 0;
    this.pid.ti = this.pid.ti ? this.pid.ti : 0;

    // асинхронна функція що виконується перед початком кроку
    // наприклад: додаткове налаштування та запуск обмежуючого терморегулятора
    // this.beforeStart =
    //   typeof props.beforeStep != "function" ? props.beforeStep : null;
    // асинхронна функція що виконується після закінчення кроку
    // наприклад: додаткове зупинка обмежуючого терморегулятора
    // this.beforeStart =
    //   typeof props.beforeStep != "function" ? props.beforeStep : null;
  } //constructor

  // async heating(currT) {}

  async start() {
    this.startTime = new Date().getTime();
    this.testProcess();
    return await super.start();
  }

  async testProcess() {
    let trace = 1,
      ln = this.ln + "testProcess()::";
    let furnace = this.devices.furnaceTRP;
    let params = { tT: 750, H: 0, Y: 0, regMode: 1, o: 20 };
    await furnace.stop();
    await furnace.setRegs(params);
    await furnace.start();
    log("w", ln, " ----- Furnace regulator started! -----");
    log("w", ln, "params=", params);
    let retort = this.devices.retortTRP;
    await retort.stop();
    let corrected_H = this.H - this.waitH;
    corrected_H = corrected_H > 0 ? corrected_H : 0;
    let corrected_tT = this.taskT - this.waitT;
    corrected_tT = corrected_tT > 0 ? corrected_tT : 0;
    params = { tT: corrected_tT, H: corrected_H, Y: 0, regMode: 2, o: 2 };
    await furnace.setRegs(params);
    await retort.start();
    log("w", ln, " ----- Retort regulator started! -----");
    log("w", ln, "params=", params);
    params.title = {
      ua: `Нагрівання ${corrected_tT}`,
      en: `Heating ${corrected_tT}`,
      ru: ``,
    };
    params.getT = retort.getT;
    params.errT = { min: 0, max: 100 };
    params.errH = 0;
    this.heating = new Heating(params);
    log("w", ln, " ----- Heating step started ! -----");
    log("w", ln, "params=", params);
    await this.heating.start();
    log("w", ln, " ----- First wave waiting started ! -----");
    log("w", ln, "params=", params);
    await dummy(this.waitH * 60 * 1000);
  }
}
