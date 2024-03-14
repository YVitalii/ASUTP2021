const ClassTaskGeneral = require("../../tasksController/ClassTaskGeneral.js");
// const ClassRegister = require("../../regsController/ClassRegister.js");
const ClassReg_number = require("../../regsController/ClassReg_number.js");
const ClassReg_regsList = require("../../regsController/ClassReg_regsList.js");
const ClassReg_select = require("../../regsController/ClassReg_select.js");
const ClassControllerPID = require("../../controllerPID/ClassControllerPID.js");
const ClassReg_timer = require("../../regsController/ClassReg_timer");
const ClassHeatingStep = require("../heating/ClassThermalHeatingStep.js");
class ClassTaskThermal extends ClassTaskGeneral {
  /**
   * Конструктор класу, оптимізованого під процес термообробки
   * @param {*} props
   * @property {Object} - стартові налаштування
   * @property {}
   */

  constructor(props = {}) {
    props.header = props.header
      ? props.header
      : {
          ua: `Термообробка`,
          en: `Heattreatment`,
          ru: `Термообработка`,
        };
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Термообробка`,
          en: `Heattreatment`,
          ru: `Термообработка`,
        };

    props.id = props.id ? props.id : "TaskThermal";
    props.ln = props.ln ? props.ln : props.id;

    super(props);
    // максимальна температура
    if (!props.maxT || props.maxT < 0) {
      throw new Error(
        this.ln + `Property "maxT" must be cpeciefied! maxT=${props.maxT}`
      );
    }

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
      max: 150,
    });

    // максимальне відхилення температури вниз
    this.regs.errTmin = new ClassReg_number({
      id: "errTmin",
      header: { ua: "errTmin,°C", en: "errTmin,°C", ru: "errTmin,°C" },
      value: props.errTmin ? props.errTmin : -0,
      comment: {
        ua: `Макс. відх. вниз (0=вимкн)`,
        en: `Limit of low temperature (0=disable)`,
        ru: `Макс. откл. вниз (0=выкл)`,
      },
      min: -100,
      max: 0,
    });

    // максимальне відхилення температури
    this.regs.errTmax = new ClassReg_number({
      id: "errTmax",
      header: { ua: "errTmax,°C", en: "errTmax,°C", ru: "errTmax,°C" },
      value: props.errTmax ? props.errTmax : +0,
      comment: {
        ua: `Макс. відх. вверх (0=вимкн)`,
        en: `Limit of high temperature (0=disable)`,
        ru: `Макс. откл. вверх (0=выкл)`,
      },
      min: 0,
      max: 100,
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
    }); //this.regs.wT

    // час нагрівання, хв
    this.regs.Y = new ClassReg_timer({
      id: "H",
      value: props.H ? props.H : 0,
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
    }); //this.regs.wT

    //  закон регулювання "Позиційний"

    let pos = new ClassReg_regsList({
      id: "pos",
      header: { ua: "ПОЗ", en: "POS", ru: "ПОЗ" },
      comment: {
        ua: `Позиційний закон регулювання`,
        en: `Positional regulation`,
        ru: `Позиционный закон регуллирования`,
      },
    });

    pos.regs.o = new ClassReg_number({
      id: "o",
      header: { ua: "Неузгодження", en: "Difference", ru: "Рассогласование" },
      value: -2,
      comment: {
        ua: `Неузгодження температур,°С`,
        en: `Temperature difference,°С`,
        ru: `Рассогласование температур,°С`,
      },
      min: -20,
      max: 0,
    });

    let pid = new ClassControllerPID();

    this.regs.regMode = new ClassReg_select({
      id: "regMode",
      header: { ua: "Регулювання", en: "Regulation", ru: "Регулирование" },
      value: "pid",
      regs: { pos, pid }, // TODO Додати роботу при позиційному законі, поки реалізований тільки ПІД
      comment: {
        ua: `Закон регулювання`,
        en: `Control type`,
        ru: `Закон регулирования`,
      },
    });

    // завантажуємо кроки процессу
    this.quickHeatingStep;
    this.heatingStep;
    this.holdingStep;
  } // constructor
} //class ClassThermoStep

module.exports = ClassTaskThermal;
