const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
const emulateDevices = require("../../config.js").emulateRS485;
const APIerror = require("../../tools/apiError.js");
const ClassStep_TRM251_nextProgram = require("./ClassStep_TRM251_nextProgram.js");

function roundTemperature(value) {
  if (value === null || value === undefined || value === "") return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return Number(num.toFixed(1));
}

function readStepField(step, name) {
  const reg = step && step.regs && step.regs[name];
  if (reg && reg.value !== undefined && reg.value !== null) return reg.value;
  if (step && step[name] !== undefined && step[name] !== null) return step[name];
  return undefined;
}

function programForDriver(program) {
  if (!Array.isArray(program) || program.length < 2) {
    throw new Error("програма має містити заголовок і хоча б один крок");
  }
  const steps = [program[0]];
  for (let index = 1; index < program.length; index++) {
    const step = program[index];
    // Службовий перехід між програмами в регістр приладу не пишеться.
    if (step && step.type === ClassStep_TRM251_nextProgram.type) continue;
    const tT = Number(readStepField(step, "tT"));
    const H = Number(readStepField(step, "H"));
    const Y = Number(readStepField(step, "Y"));
    if (![tT, H, Y].every(Number.isFinite)) {
      throw new Error(`крок ${index}: tT, H і Y мають бути числами`);
    }
    steps.push({ tT, H, Y });
  }
  if (steps.length < 2) {
    throw new Error("програма має містити заголовок і хоча б один крок");
  }
  return steps;
}

// driver.printRegsDescription();
class ClassManager extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.driver = driver;
    let addr = `[${props.addr || props.addr == 0 ? props.addr : undefined}]`;
    props.ln = props.ln ? props.ln : `TRM251-Manager[${props.addr}]::`;
    props.header = props.header
      ? props.header
      : { ua: `ТРМ251` + addr, en: `TRM251` + addr, ru: `ТРМ251` + addr };
    let trace = 0,
      ln = props.ln + "constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    super(props);
    for (let i = 1; i < 3; i++) {
      this.addRegister({
        id: `T${i}`,
        comment: {
          ua: `Температура вхід ${i}`,
          en: `Temperature of input ${i}`,
          ru: `Температура вход ${i}`,
        },
        units: units.degC,
        type: "number",
        min: -20,
        max: 1200,
        readonly: true,
        obsolescence: 10,
        driverRegName: `I${i}`,
      }); // addRegister
    } // for

    // ------- tT ----------
    this.addRegister({
      id: `tT`,
      comment: {
        ua: `Цільова температура`,
        en: `Goal temperature`,
        ru: `Целевая температура`,
      },
      units: units.degC,
      type: "number",
      min: -20,
      max: 1200,
      readonly: true,
      obsolescence: 10,
      driverRegName: `tT`,
    }); // addRegister

    // ------- mode ----------
    this.addRegister({
      id: `mode`,
      comment: {
        ua: `Стан приладу`,
        en: `Working mode`,
        ru: `Состояние прибора`,
      },
      units: { ua: ``, en: ``, ru: `` },
      type: "number",
      min: 0,
      max: 7,
      readonly: true,
      obsolescence: 10,
      driverRegName: `mode`,
    }); // addRegister
    this.regs["mode"].modesDescription = [
      { value: 0, comment: { ua: `Вимкнено`, en: `Off`, ru: `Выключено` } },
      { value: 1, comment: { ua: `Робота`, en: `Working`, ru: `Работа` } },
      {
        value: 2,
        comment: { ua: `Аварія`, en: `Critical error`, ru: `Авария` },
      },
      {
        value: 3,
        comment: { ua: `Завершено`, en: `Finished`, ru: `Завершено` },
      },
      {
        value: 4,
        comment: { ua: `Автоналаштування`, en: `Autotune`, ru: `Автонастройка` },
      },
      {
        value: 5,
        comment: {
          ua: `Очікування автоналаштування`,
          en: `Waiting for autotune`,
          ru: `Ожидание автонастройки`,
        },
      },
      {
        value: 6,
        comment: {
          ua: `Автоналаштування завершено`,
          en: `Autotune finished`,
          ru: `Автонастройка завершена`,
        },
      },
      {
        value: 7,
        comment: { ua: `Налаштування`, en: `Setup`, ru: `Настройка` },
      },
    ];
    // ------- Alarm ----------
    // окремого регістра Alarm у драйвері немає: його читає currentState
    this.addRegister({
      id: `Alarm`,
      comment: {
        ua: `Ознака аварії`,
        en: `Alarm flag`,
        ru: `Признак аварии`,
      },
      units: units.empty,
      type: "number",
      min: 0,
      max: 1,
      readonly: true,
      obsolescence: 5,
      driverRegName: `currentState`,
    });
    // ------- programN ----------
    this.addRegister({
      id: `programN`,
      comment: {
        ua: `Номер програми`,
        en: `Program number`,
        ru: `Номер программы`,
      },
      units: units.empty,
      type: "number",
      min: 1,
      max: 3,
      readonly: true,
      obsolescence: 5,
      driverRegName: `programN`,
    });
    // ------- step ----------
    this.addRegister({
      id: `step`,
      comment: {
        ua: `Поточний крок`,
        en: `Current step`,
        ru: `Текущий шаг`,
      },
      units: units.empty,
      type: "number",
      min: 1,
      max: 5,
      readonly: true,
      obsolescence: 5,
      driverRegName: `step`,
    }); // addRegister
    // ------- step ----------
    this.addRegister({
      id: `program`,
      comment: {
        ua: `Поточна програма`,
        en: `Current program`,
        ru: `Текущая программа`,
      },
      units: units.empty,
      readonly: true,
      obsolescence: 60,
      driverRegName: `program`,
    }); // addRegister
    log("w", this.ln, ` ==> Device was created`);

    if (trace) {
      console.log(ln + `this=`);
      console.dir(this, { depth: 1 });
    }
    // запуск опитування стану приладу
    this.getMode();
  } // constructor

  /**
   * Ставить номер програми і крок, потім запускає прилад.
   * Якщо mode не Stop — спочатку stop(). prN і stN за замовчуванням 1.
   * @param {{prN?: number, stN?: number}} arg
   * @returns {Promise<true>}
   */
  async continueFrom(arg = {}) {
    let ln = this.ln + "continueFrom()::";
    const prN = arg.prN == null ? 1 : arg.prN;
    const stN = arg.stN == null ? 1 : arg.stN;
    try {
      this.regs.mode.timestamp = 0;
      const mode = await this.getRegister("mode");
      if (mode != 0) await this.stop();
      const placed = await this.setPrSt({ prgN: prN, stepN: stN });
      if (placed !== true) throw placed;
      await this.driver.setRegPromise({
        iface: this.iface,
        devAddr: this.addr,
        regName: "startStop",
        value: 1,
      });
      return true;
    } catch (error) {
      if (error && error.name === "apiError") throw error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      throw new APIerror({
        ua: `Не вдалося продовжити з програми ${prN} крок ${stN}: ${reason}`,
        en: `Failed to continue from program ${prN} step ${stN}: ${reason}`,
        ru: `Не удалось продолжить с программы ${prN} шаг ${stN}: ${reason}`,
      });
    }
  }

  /**
   * Якщо прилад не зупинений — stop(), записує програму і продовжує з prN/stN.
   * prN і stN за замовчуванням 1.
   * @param {{program: Array, prN?: number, stN?: number}} arg
   * @returns {Promise<true>}
   */
  async start(arg = {}) {
    let ln = this.ln + "start()::";
    const prN = arg.prN == null ? 1 : arg.prN;
    const stN = arg.stN == null ? 1 : arg.stN;
    try {
      this.regs.mode.timestamp = 0;
      const mode = await this.getRegister("mode");
      if (mode != 0) await this.stop();
      await this.setProgram(arg.program);
      return await this.continueFrom({ prN, stN });
    } catch (error) {
      if (error && error.name === "apiError") throw error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      throw new APIerror({
        ua: `Не вдалося запустити програму ${prN} крок ${stN}: ${reason}`,
        en: `Failed to start program ${prN} step ${stN}: ${reason}`,
        ru: `Не удалось запустить программу ${prN} шаг ${stN}: ${reason}`,
      });
    }
  }

  /**
   * Зупиняє прилад, якщо він не в режимі Stop.
   * Повторна зупинка вже зупиненого приладу дає помилку Modbus, тому при mode = 0 запис не йде.
   * @returns {Promise<true>}
   */
  async stop() {
    let ln = this.ln + "stop()::";
    try {
      const mode = await this.getRegister("mode");
      if (mode != 0) {
        await this.driver.setRegPromise({
          iface: this.iface,
          devAddr: this.addr,
          regName: "startStop",
          value: 0,
        });
      }
      return true;
    } catch (error) {
      if (error && error.name === "apiError") throw error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      throw new APIerror({
        ua: `Не вдалося зупинити прилад: ${reason}`,
        en: `Failed to stop the device: ${reason}`,
        ru: `Не удалось остановить прибор: ${reason}`,
      });
    }
  }

  isTimeoutError(error) {
    if (!error) return false;
    if (error.code === 13) return true;
    let text = [
      error.message,
      error.ua,
      error.en,
      error.messages && error.messages.ua,
      error.messages && error.messages.en,
    ]
      .filter(Boolean)
      .join(" ");
    return /timeout/i.test(text);
  }

  async getMode() {
    let ln = this.ln + "getMode()::";
    let period = this.regs["mode"].obsolescence * 1000;
    try {
      await this.getRegister("mode");
    } catch (error) {
      if (!this.isTimeoutError(error)) {
        log("e", ln, error && error.message ? error.message : error);
      }
    } finally {
      setTimeout(() => {
        this.getMode();
      }, period);
    }
  } // getMode()

  async getRegister(regName) {
    let trace = 0,
      ln = this.ln + "getRegister(" + regName + ")::";
    // у цих режимах прилад не віддає tT: читання дає помилку Modbus
    if (regName == "tT") {
      let mode = this.regs["mode"].value;
      if (mode == null || mode == 0 || mode == 3 || mode == 7) return 0;
    }
    // Alarm живе всередині currentState, окремого читання в драйвері немає
    if (regName == "Alarm") {
      const state = await this.getCurrentState();
      return state.Alarm;
    }

    let res;

    try {
      res = await super.getRegister(regName);
      if (regName == "T1" || regName == "T2") {
        res = roundTemperature(res);
        this.regs[regName].value = res;
      }
      if (regName == "mode") {
        let reg = this.regs["mode"];

        reg.value = res;
        if (trace) {
          console.log(ln + "reg=");
          console.dir(reg);
        }
        this.refreshModeComment();
      } // if mode
      return res;
    } catch (error) {
      throw error;
    }
  }
  getCompactHtml(props) {
    let trace = 0,
      ln = this.ln + `getCompactHtml::`;
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    let res = this.getAll();
    res.baseUrl = props.baseUrl + this.id + "/getRegs";
    res.regs = this.getRegsForHtml();
    // console.dir(res, { depth: 3 });
    let html = pug.renderFile(__dirname + "/views/main.pug", {
      device: this,
      prefix: props?.prefix || "",
      res,
    });

    return html;
  }

  getRegsForHtml(props) {
    let regs = {};
    for (const key in this.regs) {
      if (Object.prototype.hasOwnProperty.call(this.regs, key)) {
        regs[key] = this.regs[key].getAll();
      }
    } // for
    return regs;
  }

  getFullHtml() {
    return this.getCompactHtml();
  }

  refreshModeComment() {
    let reg = this.regs["mode"];
    if (reg.value == null) {
      reg.comment = {
        ua: `Немає зв'язку!`,
        en: `Not connected!`,
        ru: `Нет связи!`,
      };
      return;
    }
    let described = reg.modesDescription[reg.value];
    let comment = described && described.comment;
    reg.comment =
      comment && comment.ua
        ? comment
        : {
            ua: `mode=${reg.value}`,
            en: `mode=${reg.value}`,
            ru: `mode=${reg.value}`,
          };
  }

  async getT() {
    this.regs.T1.timestamp = 0;
    const value = await this.getRegister("T1");
    this.regs.T1.value = value;
    return value;
  }

  /**
   * Читає регістр currentState і записує Alarm, programN, step, mode у this.regs.
   * @returns {Promise<{Alarm: number, programN: number, step: number, mode: number}>}
   */
  async getCurrentState() {
    let ln = this.ln + "getCurrentState()::";
    try {
      const res = await this.driver.getRegPromise({
        iface: this.iface,
        devAddr: this.addr,
        regName: "currentState",
      });
      const value = Array.isArray(res) ? res[0] && res[0].value : res && res.value;
      if (!value) throw new Error("прилад не повернув поточний стан");
      const ids = ["Alarm", "programN", "step", "mode"];
      const next = {};
      for (const id of ids) {
        const num = Number(value[id]);
        if (!Number.isInteger(num)) {
          throw new Error(`currentState.${id}=${value[id]}`);
        }
        next[id] = num;
      }
      for (const id of ids) {
        this.regs[id].value = next[id];
      }
      this.refreshModeComment();
      return value;
    } catch (error) {
      if (error && error.name === "apiError") throw error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      throw new APIerror({
        ua: `Не вдалося прочитати поточний стан: ${reason}`,
        en: `Failed to read the current state: ${reason}`,
        ru: `Не удалось прочитать текущее состояние: ${reason}`,
      });
    }
  }

  async setProgram(program) {
    let ln = this.ln + "setProgram()::";
    try {
      const value = programForDriver(program);
      return await this.driver.setRegPromise({
        iface: this.iface,
        devAddr: this.addr,
        regName: "program",
        value,
      });
    } catch (error) {
      if (error && error.name === "apiError") throw error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      throw new APIerror({
        ua: `Не вдалося записати програму: ${reason}`,
        en: `Failed to write the program: ${reason}`,
        ru: `Не удалось записать программу: ${reason}`,
      });
    }
  }

  /**
   * Запис одного регістра менеджера в прилад і в regs.
   * @param {String} regName id регістра в this.regs
   * @param {Number} value
   */
  async setReg(regName, value) {
    let ln = this.ln + `setReg(${regName}=${value})::`;
    let reg = this.regs[regName];
    if (!reg) throw new Error(ln + `regs[${regName}] is undefined!`);
    const res = await this.driver.setRegPromise({
      iface: this.iface,
      devAddr: this.addr,
      regName: reg.driverRegName,
      value,
    });
    const written = res && res.value != null ? res.value : value;
    reg.value = written;
    return written;
  }

  /**
   * Ставить поточну програму і крок приладу.
   * Дозволено лише в режимі Stop (mode = 0).
   * @param {{prgN: number, stepN: number}} arg prgN 1..3, stepN 1..5
   * @returns {Promise<true|APIerror>}
   */
  async setPrSt(arg = {}) {
    let ln = this.ln + "setPrSt()::";
    const prgN = Number(arg.prgN);
    const stepN = Number(arg.stepN);
    try {
      if (!Number.isInteger(prgN) || prgN < 1 || prgN > 3) {
        throw new Error(`prgN=${arg.prgN} має бути 1..3`);
      }
      if (!Number.isInteger(stepN) || stepN < 1 || stepN > 5) {
        throw new Error(`stepN=${arg.stepN} має бути 1..5`);
      }
      // кеш mode може бути застарілим: перед записом читаємо прилад
      this.regs.mode.timestamp = 0;
      const mode = await this.getRegister("mode");
      if (mode !== 0) {
        throw new Error(
          `програму і крок можна встановлювати лише коли прилад зупинено (mode=0), зараз mode=${mode}`,
        );
      }
      await this.setReg("programN", prgN);
      await this.setReg("step", stepN);
      return true;
    } catch (error) {
      if (error && error.name === "apiError") return error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      return new APIerror({
        ua: `Не вдалося встановити програму ${arg.prgN} крок ${arg.stepN}: ${reason}`,
        en: `Failed to set program ${arg.prgN} step ${arg.stepN}: ${reason}`,
        ru: `Не удалось установить программу ${arg.prgN} шаг ${arg.stepN}: ${reason}`,
      });
    }
  }
}

module.exports = ClassManager;

if (!module.parent) {
  // якщо запущено як окремий модуль

  let w2 = {
    send: (val) => {
      return val;
    },
  };
  let entity = new ClassManager({ iface: w2, id: "TRM251", addr: 1 });
  // console.dir(entity, { depth: 2 });
  console.dir(entity);
  // console.dir(entity.getCompactHtml({ baseUrl: "/devices/OWEN_TRM251/" }));
  // async function read() {
  //   let res = await entity.getParams("T1;T2;T3;T4;T5;T6;T7;T8");
  //   console.dir(res);
  //   setTimeout(read, 2000);
  // }

  //read();
  //console.log(entity.getFullHtml());
}
