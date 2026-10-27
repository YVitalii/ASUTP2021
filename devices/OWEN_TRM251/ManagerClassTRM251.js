const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
const emulateDevices = require("../../config.js").emulateRS485;
const APIerror = require("../../tools/apiError.js");

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
  return program.map((step, index) => {
    if (index === 0) return step;
    const tT = Number(readStepField(step, "tT"));
    const H = Number(readStepField(step, "H"));
    const Y = Number(readStepField(step, "Y"));
    if (![tT, H, Y].every(Number.isFinite)) {
      throw new Error(`крок ${index}: tT, H і Y мають бути числами`);
    }
    return { tT, H, Y };
  });
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

  // async start() {
  //   let trace = 1,
  //     ln = this.ln + `Start()::`;
  //   let res;
  //   try {
  //     res = this.driver.setRegPromise({
  //       iface: this.iface,
  //       devAddr: this.addr,
  //       regName: "startStop",
  //       value: 1,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // } // start()

  // async stop() {
  //   let trace = 1,
  //     ln = this.ln + `Stop()::`;
  //   let res;
  //   try {
  //     res = this.driver.setRegPromise({
  //       iface: this.iface,
  //       devAddr: this.addr,
  //       regName: "startStop",
  //       value: 0,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // } // start()

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

    let res;

    try {
      res = await super.getRegister(regName);
      if (regName == "mode") {
        let reg = this.regs["mode"];

        reg.value = res;
        if (trace) {
          console.log(ln + "reg=");
          console.dir(reg);
        }
        if (reg.value == null) {
          reg.comment = {
            ua: `Немає зв'язку!`,
            en: `Not connected!`,
            ru: `Нет связи!`,
          };
        } else {
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

  async getT() {
    return this.getRegister("T1");
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
