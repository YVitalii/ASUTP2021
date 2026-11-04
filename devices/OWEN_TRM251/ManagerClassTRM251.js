const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
const emulateDevices = require("../../config.js").emulateRS485;
const APIerror = require("../../tools/apiError.js");
const ClassStep_TRM251_goToPrSt = require("./ClassStep_TRM251_goToPrSt.js");

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
    if (step && step.type === ClassStep_TRM251_goToPrSt.type) continue;
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
    // пауза між спробами запуску, мс; за замовчуванням 2 с
    this.timeout = props.timeout ? props.timeout : 2 * 1000;
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
      if (mode != 0) {
        const stopped = await this.stop();
        if (stopped !== true) throw stopped;
      }
      const placed = await this.setPrSt({ prN, stN });
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
   * Ставить програму і крок через setPrSt, потім вмикає прилад.
   * prN і stN, якщо їх немає, ставить setPrSt: обидва 1. Програму в регістр цей метод не пише.
   * Поки mode = 0, до 3 разів пише startStop = 1 і чекає this.timeout.
   * mode = 1 → true. Інакше APIerror з поточним mode.
   * @param {{prN?: number, stN?: number}} arg
   * @returns {Promise<true|APIerror>}
   */
  async start(arg = {}) {
    let ln = this.ln + "start()::";
    const placed = await this.setPrSt(arg);
    if (placed !== true) return placed;

    try {
      let mode = await this.getRegisterDirectly("mode");
      let times = 3;
      while (mode == 0 && times > 0) {
        await this.driver.setRegPromise({
          iface: this.iface,
          devAddr: this.addr,
          regName: "startStop",
          value: 1,
        });
        await dummyPromise(this.timeout);
        mode = await this.getRegisterDirectly("mode");
        times -= 1;
      }
      if (mode == 1) return true;
      const error = new APIerror({
        ua: `Прилад не запустився, mode=${mode}`,
        en: `Device did not start, mode=${mode}`,
        ru: `Прибор не запустился, mode=${mode}`,
      });
      log("e", ln, error.msg.ua);
      return error;
    } catch (error) {
      if (error && error.name === "apiError") return error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      return new APIerror({
        ua: `Не вдалося запустити прилад: ${reason}`,
        en: `Failed to start the device: ${reason}`,
        ru: `Не удалось запустить прибор: ${reason}`,
      });
    }
  }

  /**
   * Зупиняє прилад. Аргументів немає.
   * Поки mode не 0, до 3 разів пише startStop = 0 і чекає this.timeout.
   * mode = 0 → true. Інакше APIerror з поточним mode.
   * Уже зупинений прилад не отримує повторний запис startStop.
   * @returns {Promise<true|APIerror>}
   */
  async stop() {
    let ln = this.ln + "stop()::";

    try {
      let mode = await this.getRegisterDirectly("mode");
      let times = 3;
      while (mode != 0 && times > 0) {
        await this.driver.setRegPromise({
          iface: this.iface,
          devAddr: this.addr,
          regName: "startStop",
          value: 0,
        });
        await dummyPromise(this.timeout);
        mode = await this.getRegisterDirectly("mode");
        times -= 1;
      }
      if (mode == 0) return true;
      const error = new APIerror({
        ua: `Прилад не зупинився, mode=${mode}`,
        en: `Device did not stop, mode=${mode}`,
        ru: `Прибор не остановился, mode=${mode}`,
      });
      log("e", ln, error.msg.ua);
      return error;
    } catch (error) {
      if (error && error.name === "apiError") return error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      return new APIerror({
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

  /**
   * Читає регістр з приладу, минаючи кеш.
   * @param {String} regName id регістра в this.regs
   * @returns {Promise<*>}
   */
  async getRegisterDirectly(regName) {
    this.regs[regName].timestamp = 0;
    return this.getRegister(regName);
  }

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
    return this.getRegister("T1");
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
   * prN і stN за замовчуванням 1. Дозволено лише в режимі Stop (mode = 0).
   * До 3 разів пише програму і крок, чекає this.timeout і читає їх з приладу.
   * Повертає true, коли прочитані значення збігаються із заданими.
   * @param {{prN?: number, stN?: number}} arg prN 1..3, stN 1..5
   * @returns {Promise<true|APIerror>}
   */
  async setPrSt(arg = {}) {
    let ln = this.ln + "setPrSt()::";
    const prN = arg.prN == null ? 1 : arg.prN;
    const stN = arg.stN == null ? 1 : arg.stN;
    const programN = Number(prN);
    const stepN = Number(stN);
    try {
      if (!Number.isInteger(programN) || programN < 1 || programN > 3) {
        throw new Error(`prN=${prN} має бути 1..3`);
      }
      if (!Number.isInteger(stepN) || stepN < 1 || stepN > 5) {
        throw new Error(`stN=${stN} має бути 1..5`);
      }
      // кеш mode може бути застарілим: перед записом читаємо прилад
      const mode = await this.getRegisterDirectly("mode");
      if (mode !== 0) {
        throw new Error(
          `програму і крок можна встановлювати лише коли прилад зупинено (mode=0), зараз mode=${mode}`,
        );
      }
      let placedProgram;
      let placedStep;
      let times = 3;
      while (times > 0) {
        await this.setReg("programN", programN);
        await this.setReg("step", stepN);
        await dummyPromise(this.timeout);
        placedProgram = Number(await this.getRegisterDirectly("programN"));
        placedStep = Number(await this.getRegisterDirectly("step"));
        if (placedProgram === programN && placedStep === stepN) return true;
        times -= 1;
      }
      throw new Error(
        `прилад лишився на програмі ${placedProgram} крок ${placedStep}`,
      );
    } catch (error) {
      if (error && error.name === "apiError") return error;
      let reason = error && error.message ? error.message : String(error);
      log("e", ln, reason);
      return new APIerror({
        ua: `Не вдалося встановити програму ${prN} крок ${stN}: ${reason}`,
        en: `Failed to set program ${prN} step ${stN}: ${reason}`,
        ru: `Не удалось установить программу ${prN} шаг ${stN}: ${reason}`,
      });
    }
  }
}

module.exports = ClassManager;

if (!module.parent) {
  // якщо запущено як окремий модуль

  let w2 = {
    send: async (val) => {
      return val;
    },
  };
  let entity = new ClassManager({ iface: w2, id: "TRM251", addr: 16 });
  // console.dir(entity, { depth: 2 });
  // console.dir(entity);
  // console.dir(entity.getCompactHtml({ baseUrl: "/devices/OWEN_TRM251/" }));
  async function read() {
     let res = await entity.getT();
     console.dir(res);
     setTimeout(read, 2000);
  }

  read();
  //console.log(entity.getFullHtml());
}
