const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
const emulateDevices = require("../../config.js").emulateRS485;

// driver.printRegsDescription();
class ClassManager extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.driver = driver;
    let addr = `[${props.addr || props.addr == 0 ? props.addr : undefined}]`;
    props.ln = props.ln ? props.ln : `TRM251-Manager[${props.addr}]::`;
    props.header = props.header
      ? props.header
      : { ua: `ТРМ251` + addr, en: `TRM251` + addr, ru: `ТРМ251` + addr };
    let trace = 1,
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
    this.regs["mode"].modesDescription=[
        { value: 0, comment: { ua: `Вимкнено`, en: `Off`, ru: `Выключено` } },
        { value: 1, comment: { ua: `Робота`, en: `Working`, ru: `Работа` } },
        {
          value: 2,
          comment: { ua: `Аварія`, en: `Critical error`, ru: `Авария` },
        },
        { value: 3, comment: { ua: `Завершено`, en: ``, ru: `` } },
        { value: 4, comment: { ua: `Автоналаштування`, en: ``, ru: `` } },
        {
          value: 5,
          comment: { ua: `Очікування автоналаштування`, en: ``, ru: `` },
        },
        {
          value: 6,
          comment: { ua: `Автоналаштування завершено`, en: ``, ru: `` },
        },
        {
          value: 7,
          comment: { ua: `Налаштування`, en: `Setup`, ru: `Настройка` },
        },
      ];
    log("w", this.ln, ` ==> Device was created`);
    if (trace) {
      console.log(ln + `this=`);
      console.dir(this, { depth: 1 });
    }
  } // constructor
  async getRegister(regName) {
    let trace=0,ln=this.ln+"getRegister("+regName+")::"
    // якщо режим null,0,3,7 - то tT недоступний
    if (regName == "tT") {
      let mode = this.regs["mode"].value;
      if (mode == null || mode == 0 || mode == 3 || mode == 7) return null;
    }

    let res;

    try {
      res = await super.getRegister(regName);
      if (regName == "mode") { 
        let reg = this.regs["mode"];
        
        reg.value = res;
        if (trace) {
          console.log(ln+"reg=")
          console.dir(reg);
        }
        reg.comment =
          reg.modesDescription[reg.value].comment &&
          reg.modesDescription[reg.value].comment.ua
            ? reg.modesDescription[reg.value].comment
            : {
                ua: `mode=${reg.value}`,
                en: `mode=${reg.value}`,
                ru: `mode=${reg.value}`,
              };
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
}

module.exports = ClassManager;

if (!module.parent) {
  // якщо запущено як окремий модуль
  let w2 = require("../../conf_iface.js").w2;
  let entity = new ClassManager({ iface: w2, id: "TRM251", addr: 1 });
  // console.dir(entity, { depth: 2 });
  console.dir(entity.getCompactHtml({ baseUrl: "/devices/OWEN_TRM251/" }));
  async function read() {
    let res = await entity.getParams("T1;T2;T3;T4;T5;T6;T7;T8");
    console.dir(res);
    setTimeout(read, 2000);
  }

  //read();
  //console.log(entity.getFullHtml());
}
