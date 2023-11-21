let ClassStep = require("../classStep/ClassStep.js");
//const devices = require("../../devices/devices.js");
const Heating = require("../heatingStep/ClassHeatingStep.js");
const Holding = require("../holdingStep/ClassHoldingStep.js");
const dummy = require("../../../../tools/dummy.js").dummyPromise;
let log = require("../../../../tools/log.js");
let test = true;

class ClassThermStep extends ClassStep {
  constructor(props) {
    super(props);
    let trace = 1,
      ln = this.ln + "constructor()::";

    this.devices = props.devices;

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.H = props.H ? props.H : 0;

    // хв, тривалість витримки, якщо 0 = до зупинки вручну
    this.Y = props.Y ? props.Y : 0;

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
    // поточний етап виконання програми
    this.currStep = null;
    // поточний опис
    this.currNote = { ua: `undefined`, en: `undefined`, ru: `undefined` };
    // асинхронна функція що виконується перед початком кроку
    // наприклад: додаткове налаштування та запуск обмежуючого терморегулятора
    // this.beforeStart =
    //   typeof props.beforeStep != "function" ? props.beforeStep : null;
    // асинхронна функція що виконується після закінчення кроку
    // наприклад: додаткове зупинка обмежуючого терморегулятора
    // this.beforeStart =
    //   typeof props.beforeStep != "function" ? props.beforeStep : null;
    if (trace) {
      log("i", ln, `this=`);
      console.dir(this);
    }
  } //constructor

  // async heating(currT) {}

  async start() {
    this.startTime = new Date().getTime();
    this.testProcess();
    return await super.start();
  }

  async stop() {
    super.stop();
    if (this.currStep != null) {
      await this.currStep.stop();
    }
    this.currNote = {
      ua: `Зупинено`,
      en: `Stoped`,
      ru: `Остановлено`,
    };
    await this.devicesStop();
    return 1;
  }

  async devicesStop() {
    //console.log("this.devices=");
    //console.dir(this.devices);
    for (let device in this.devices) {
      console.log("device=");
      console.dir(device);
      if (this.devices.hasOwnProperty(device)) {
        await this.devices[device].stop();
      }
    }
  }

  async finish() {
    if (this.currStep != null) {
      await this.currStep.finish();
    }
    await this.devicesStop();
    super.finish();
    this.currNote = {
      ua: `Завершено`,
      en: `Finished`,
      ru: `Завершено`,
    };
    return 1;
  }

  async testProcess() {
    let trace = 1,
      ln = "testProcess()::";
    this.currStep = null;
    this.currNote = {
      ua: `Нагрівання.Програмування приладів`,
      en: `Heating. Program devices`,
      ru: `Нагрев. Програмирование приборов`,
    };
    // ----------  налаштування терморегулятора печі для кроку Нагрівання ------------
    let furnace = this.devices.furnaceTRP;
    let params = { tT: 750, H: 0, Y: 0, regMode: 1, o: 20 };
    if (this.state == "going") {
      await furnace.stop();
      await furnace.setRegs(params);
      await furnace.start();
      this.logger("w", ln + " ----- Furnace regulator started! -----");
      this.logger("w", ln + "params=" + JSON.stringify(params));
    }
    let retort = this.devices.retortTRP;
    // ----------  налаштування терморегулятора реторти для кроку Нагрівання ------------

    let corrected_H = this.H - this.waitH;
    corrected_H = corrected_H > 0 ? corrected_H : 0;
    let corrected_tT = this.taskT - this.waitT;
    corrected_tT = corrected_tT > 0 ? corrected_tT : 0;
    params = { tT: corrected_tT, H: corrected_H, Y: 0, regMode: 2, o: 2 };
    if (this.state == "going") {
      await retort.stop();
      await furnace.setRegs(params);
      await retort.start();
      this.logger("w", ln + " -----Retort regulator started! -----");
      this.logger("w", ln + "params=" + JSON.stringify(params));
    }

    // ----------  налаштування для кроку Нагрівання ------------
    params.title = {
      ua: `Нагрівання ${corrected_tT}C`,
      en: `Heating ${corrected_tT}C`,
      ru: ``,
    };
    params.taskT = params.tT;
    // if (trace) {
    //   log("i", ln, `retort=`);
    //   console.dir(retort);
    // }
    params.getT = this.getT;
    // params.getT = async () => {
    //   return await retort.getT();
    // };
    params.errT = { min: 0, max: 100 };
    params.errH = 0;

    //console.dir(params);
    if (this.state == "going") {
      this.logger("w", ln + " ----- Heating step started ! -----");
      this.logger("w", ln + "params=" + JSON.stringify(params));
      this.currStep = new Heating(params);
      this.currNote = params.title;
      await this.currStep.start();
    }

    // ---------- очікування вершини першої хвилі ----------
    this.currStep = null;
    params = {};
    params.getT = this.getT;
    params.title = {
      ua: `Інерція ${corrected_tT}C`,
      en: `Inertion ${corrected_tT}C`,
      ru: `Инерция ${corrected_tT}C`,
    };
    params.waveAskPeriod = this.waitH / 10;
    if (this.state == "going") {
      //this.currStep = new firstWave(params);
      //this.currNote = params.title;
      //await this.currStep.start();
    }

    this.currNote = params.title;

    this.logger("w", ln + " ----- First wave waiting started ! -----");
    this.logger("w", ln + "params=" + JSON.stringify(params));
    await dummy(this.waitH * 60 * 1000);

    // -------- початок режиму витримка --------
    // обнуляємо поточний крок, щоб коли прийде команда стоп не було куди її передавати
    this.currStep = null;
    // налаштування ТРП
    params = {
      tT: this.taskT,
      H: 0,
      Y: 0, // тому що витримка йде по хімічному процесу, тобто ми звідти зупинимо нагрівання вручну
      regMode: 1,
      o: this.pid.o,
      td: this.pid.td,
      ti: this.pid.ti,
    };

    if (this.state == "going") {
      await retort.stop();
      await retort.setRegs(params);
      //await retort.start();
      this.logger("w", ln + " ----- Retort TRP programed -----");
      this.logger("w", ln + "params=" + JSON.stringify(params));
    }

    let msg = `${this.taskT}C[${this.errT.min}..+${this.errT.max}]`;
    params.title = {
      ua: `Витримка ${msg}`,
      en: `Holding ${msg}`,
      ru: ``,
    };

    params.errT = this.errT;
    params.taskT = this.taskT;
    params.getT = this.getT;

    if (this.state == "going") {
      this.currStep = new Holding(params);
      this.logger("w", ln + " ----- Holding started ! -----");
      this.logger("w", ln + "params=" + JSON.stringify(params));
      await this.currStep.start();
      if (trace) {
        log("i", ln, `params=`);
        console.dir(params);
      }
    }

    this.finish();
  }
}

module.exports = ClassThermStep;
