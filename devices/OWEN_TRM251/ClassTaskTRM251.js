const ClassTaskGeneral = require("../../controllers/tasksController/ClassTaskGeneral.js");
const ClassOneStepTRM251 = require("../OWEN_TRM251/ClassOneStepTRM251.js");
const ClassStepSerial = require("../../controllers/ClassStep/ClassStepsSerial.js");
const ClassReg_number = require("../../controllers/regsController/ClassReg_number.js");
const ClassReg_timer = require("../../controllers/regsController/ClassReg_timer");
const clone = require("clone");
const log = require("../../tools/log.js");

class ClassTaskTRM251 extends ClassTaskGeneral {
  constructor(props = {}) {
    props.header = props.header
      ? props.header
      : {
          ua: `Термообробка ТРМ251`,
          en: `Heat Treatment TRM251 `,
          ru: `Термообработка ТРМ251`,
        };
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Термообробка`,
          en: `HeatTreatment`,
          ru: `Термообработка`,
        };
    props.id = "taskThermalTRM251";
    // викликаємо конструктор батьківського класу
    super(props);
    // максимальна температура
    if (!props.maxT || props.maxT < 0) {
      throw new Error(
        this.ln + `Property "maxT" must be cpecified! maxT=${props.maxT}`
      );
    }
    this.maxT = props.maxT;
    // задана температура
    this.regs.tT = new ClassReg_number({
      id: "tT",
      type: "number",
      value: props.tT ? props.tT : 0,
      header: { ua: "T,°C", en: "T,°C", ru: "T,°C" },
      comment: {
        ua: `Цільова температура`,
        en: `Task temperature`,
        ru: `Целевая температура`,
      },
      min: 0,
      max: props.maxT ? props.maxT : 100,
    });
    // час нагрівання, хв
    this.regs.H = new ClassReg_timer({
      id: "H",
      value: props.H ? props.H : 0,
      header: {
        ua: "Час нагрівання",
        en: "Time of Heating",
        ru: "Время разогрева",
      },
      comment: {
        ua: `0 = макс. швидко`,
        en: `0 = quick`,
        ru: `0 = макс. быстро`,
      },
      min: 0,
      max: 24 * 60 - 1, // input time має максимум 23:59, за потреби довше - дублювати кроки
    }); //this.regs.H
    // час утримання, хв
    this.regs.Y = new ClassReg_timer({
      id: "Y",
      value: props.Y ? props.Y : 0,
      header: {
        ua: "Час витримки",
        en: "Time of Holding",
        ru: "Время выдержки",
      },
      comment: {
        ua: `0 = зовнішній стоп`,
        en: `0 = external stop`,
        ru: `0 = внешний стоп`,
      },
      min: 0,
      max: 24 * 60 - 1, // input time має максимум 23:59, за потреби довше - дублювати кроки
    }); //this.regs.Y
  }
  /**
   * Повертає копію this.reg для рендерингу сторінки
   * видаляє непотрібні поля devices
   */
  getRegForHtml() {
    let trace = 0,
      ln = this.ln + "getRegForHtml()::";
    let reg = clone(this);
    reg.devices = undefined;
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }

    return reg;
  }
  /**
   * Повертає крок для виконання в ProcessManager
   * @param {Array} regs = Программа в форматі [{id,title,description,date},{tT,H,Y},{tT,H,Y}..]
   * @returns {ClassStepGeneral} res -
   */
  getStep(regs) {
    let res = new ClassStepSerial();
    for (let i = 0; i < regs.length; i++) {
      let props = { ...regs[i] };
      let step = new ClassOneStepTRM251(regs[i]);
      res.tasks.push(step);
    }
    return res;
  }
} // class

module.exports = ClassTaskTRM251;
