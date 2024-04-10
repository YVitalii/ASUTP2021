const ClassTaskGeneral = require("../../tasksController/ClassTaskGeneral.js");
// const ClassRegister = require("../../regsController/ClassRegister.js");
const ClassReg_number = require("../../regsController/ClassReg_number.js");
const ClassReg_regsList = require("../../regsController/ClassReg_regsList.js");
const ClassReg_select = require("../../regsController/ClassReg_select.js");
const ClassControllerPID = require("../../controllerPID/ClassControllerPID.js");
const ClassReg_timer = require("../../regsController/ClassReg_timer");
const ClassQuickHeatingStep = require("../quickHeatingStep/ClassQuickHeatingStep.js");
const ClassHeatingStep = require("../heatingStep/ClassHeatingStep.js");
const ClassHoldingStep = require("../holdingStep/ClassHoldingStep.js");
const ClassStepsSerial = require("../../ClassStep/ClassStepsSerial.js");
const ClassStepsParallel = require("../../ClassStep/ClassStepsParallel.js");

const log = require("../../../tools/log.js");

class ClassTaskThermal extends ClassTaskGeneral {
  /**
   * Конструктор класу, оптимізованого під процес термообробки
   * @param {Object} props - стартові налаштування
   * @property {Array}  props.devices - список приладів, що беруть участь у виконанні кроку
   * @property {Number}  props.maxT - максимальна температура об'єкту керування
   * @property {Number} props.errTmin=0 - температурний коридор, нижня границя, 0=вимкнено
   * @property {Number} props.errTmax=0 - температурний коридор, верхня границя, 0=вимкнено
   * @property {Number} props.H=0 -хвилини, час нагрівання, 0 = макс. швидко
   * @property {Number} props.tT=0 -хвилини, час витримки, 0 = зовнішній стоп
   *
   */

  constructor(props = {}) {
    props.header = props.header
      ? props.header
      : {
          ua: `Термообробка`,
          en: `Heat Treatment`,
          ru: `Термообработка`,
        };
    props.comment = props.comment
      ? props.comment
      : {
          ua: `Термообробка`,
          en: `HeatTreatment`,
          ru: `Термообработка`,
        };

    props.id = "taskThermal";
    props.ln = props.ln ? props.ln : props.id + "::";

    super(props);
    let trace = 0,
      ln = this.ln + "constructor()";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    // максимальна температура
    if (!props.maxT || props.maxT < 0) {
      throw new Error(
        this.ln + `Property "maxT" must be cpecified! maxT=${props.maxT}`
      );
    }
    this.devices = [];
    // перевіряємо список приладів, що приймають участь в керуванні
    if (
      !(
        props.devices &&
        Array.isArray(props.devices) &&
        props.devices.length > 0
      )
    ) {
      throw new Error(
        this.ln +
          `props.devices must be cpecified! typeof props.devices = ${typeof props.devices}`
      );
    }
    for (let i = 0; i < props.devices.length; i++) {
      let trace = 0,
        ln = this.ln + "testDevices()::";
      let element = props.devices[i];
      if (trace) {
        log("i", ln, `device=`);
        console.dir(element);
      }
      if (!element) {
        log("e", ln, ` device not defined!`);
      }
      // if (trace) {
      //   console.log("i", ln, `props.devices[${i}].getT=`);
      //   console.dir(props.devices[i].getT);
      // }
      if (!element.getT || typeof element.getT != "function") {
        throw new Error(
          this.ln +
            `props.devices.getT must be async function? but typeof props.devices[${i}].getT = ${typeof element.getT}`
        );
      } //if (!element.getT || typeof element.getT != "function"
      this.devices.push(element);
    } //for (let i = 0; i < props.devices.length; i++)

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

    // максимальне відхилення температури вниз
    this.regs.errTmin = new ClassReg_number({
      id: "errTmin",
      header: { ua: "errTmin,°C", en: "errTmin,°C", ru: "errTmin,°C" },
      value: props.errTmin ? props.errTmin : -0, //від'ємні значення
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

  /**
   * Створює та повертає крок термообробки
   * @param {} regs
   * @returns
   */
  getStep(regs) {
    let trace = 1,
      ln = this.ln + "getStep()::";

    if (typeof regs != "object") {
      throw new Error(
        ln + "regs must be an Object typeof regs= " + typeof regs
      );
    }
    if (trace) {
      log("i", ln, `regs=`);
      console.dir(regs);
    }
    let res = [];
    let quickHeatingSteps = [];
    let heatingSteps = [];
    let holdingSteps = [];

    for (let i = 0; i < this.devices.length; i++) {
      const device = this.devices[i];
      // --------- quick heating steps ----------
      if (regs.wT != undefined || regs.wT != 0 || regs.H == 0) {
        quickHeatingSteps.push(
          new ClassQuickHeatingStep({
            id: regs.id,
            regs,
            getT: async () => {
              return device.getT();
            },
            beforeStart: async (regs) => {
              //await device.setParams(regs);
              return device.start(regs);
            },
          })
        ); //push
      } //if (regs.wT != undefined || regs.wT != 0 || regs.H == 0)

      // ---------- heating step ----------
      heatingSteps.push(
        new ClassHeatingStep({
          id: regs.id,
          regs,
          getT: async () => {
            return device.getT();
          },
          beforeStart: async (regs) => {
            //await device.setParams(regs);
            return device.start(regs);
          },
        })
      ); //push

      // ---------- holding step ----------

      holdingSteps.push(
        new ClassHoldingStep({
          id: regs.id,
          regs,
          getT: async () => {
            return device.getT();
          },
          beforeStart: async (regs) => {
            //await device.setParams(regs);
            return device.start(regs);
          },
        })
      ); //push
    } // for
    if (quickHeatingSteps.length > 0) {
      if (quickHeatingSteps.length === 1) {
        quickHeatingSteps = quickHeatingSteps[0];
      } else {
        quickHeatingSteps = new ClassStepsParallel({
          tasks: quickHeatingSteps,
        });
      }
      res.push(quickHeatingSteps);
    }

    if (heatingSteps.length > 0) {
      if (heatingSteps.length === 1) {
        heatingSteps = heatingSteps[0];
      } else {
        heatingSteps = new ClassStepsParallel({
          tasks: heatingSteps,
        });
      }
      res.push(heatingSteps);
    }

    if (holdingSteps.length > 0) {
      if (holdingSteps.length === 1) {
        holdingSteps = holdingSteps[0];
      } else {
        holdingSteps = new ClassStepsParallel({
          tasks: holdingSteps,
        });
      }
      res.push(holdingSteps);
    }
    res = new ClassStepsSerial({ tasks: res });
    return res; //{ header: { ua: `123`, en: `123`, ru: `123` } };
  }
} //class ClassThermoStep

module.exports = ClassTaskThermal;
