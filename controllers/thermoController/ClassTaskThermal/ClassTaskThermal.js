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
const clone = require("clone");

const log = require("../../../tools/log.js");

class ClassTaskThermal extends ClassTaskGeneral {
  /**
   * Конструктор класу, оптимізованого під процес термообробки
   * @param {Object} props - стартові налаштування
   * @property {Array}  props.devices - список приладів, що беруть участь у виконанні кроку
   * @property {Number} props.maxT - максимальна температура об'єкту керування
   * @property {Number} props.errTmin=0 - температурний коридор, нижня границя, 0=вимкнено
   * @property {Number} props.errTmax=0 - температурний коридор, верхня границя, 0=вимкнено
   * @property {Number} props.H=0 -хвилини, час нагрівання, 0 = макс. швидко
   * @property {Number} props.errH=0 - хвилини, помилка часу розігрівання,  0 = не контролювати
   * @property {Number} props.tT=0 - цільова температура
   * @property {Number} props.firstWave - параметри пошуку першої хвилі перерегулювання
   * @property {Number} props.firstWave.period=30 - сек, період між запитами поточної температури
   * @property {Number} props.firstWave.points=10 - кільк. точок для визначення середньої похідної
   * @property {Number} props.firstWave.dT=0.1 - якщл середня похідна менше ніж dT, рахується що стабілізація наступила
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
      ln = this.ln + "constructor()::";
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
      props.devices &&
      Array.isArray(props.devices) &&
      props.devices.length > 0
    ) {
      for (let i = 0; i < props.devices.length; i++) {
        this.addDevice(props.devices[i]);
      } //for (let i = 0; i < props.devices.length; i++)
    }

    // параметри першої хвилі
    this.firstWave = props.firstWave ? props.firstWave : {};
    // в this.regs знаходяться параметри програми, які задає користувач
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
    this.regs.wT = new ClassReg_number({
      id: "wT",
      header: { ua: "wT,°C", en: "wT,°C", ru: "wT,°C" },
      value: props.wT ? props.wT : -0, //від'ємні значення
      comment: {
        ua: `Закінчення швидrого нагрівання (0=вимкн)`,
        en: `Limit for quick heating (0=disable)`,
        ru: `Окончание быстрого нагрева (0=выкл)`,
      },
      min: -100,
      max: 0,
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
    }); //this.regs.H

    // час нагрівання, хв
    this.regs.errH = new ClassReg_timer({
      id: "errH",
      value: props.errH ? props.errH : 0,
      header: {
        ua: "Помилка часу нагрівання",
        en: "Error of heating time",
        ru: "Ошибка времени разогрева",
      },
      comment: {
        ua: `0 = вимкн.`,
        en: `0 = off`,
        ru: `0 = выкл.`,
      },
      min: 0,
      max: 90, // 90 хв думаю буде достатньои
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
      attributes: { step: 1 },
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

    if (trace) {
      log("i", ln, `this.regs.regMode=`);
      console.dir(this.regs.regMode, { depth: 4 });
    }
  } // constructor

  /**
   * Реєструє прилад
   * @param {Object} device
   */
  addDevice(device) {
    let trace = 0,
      ln = this.ln + "addDevice::";
    if (trace) {
      log("i", ln, `device=`);
      console.dir(device);
    }
    log("i", ln, `device=`, device.id);
    if (!device.getT || typeof device.getT != "function") {
      throw new Error(
        this.ln +
          `props.devices.getT must be async function? but typeof props.devices[${i}].getT = ${typeof device.getT}`
      );
    }
    this.devices.push(device);
    log("i", ln, `device= [`, device.id, "] was added.");
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
    reg.firstWave = undefined;
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }

    return reg;
  }

  /**
   * Створює та повертає крок термообробки
   * @param {} regs
   * @returns
   */
  getStep(regs) {
    let trace = 0,
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
    let stepTaskPoints = [];

    // --- для всіх приладів створюємо кроки
    for (let i = 0; i < this.devices.length; i++) {
      const device = this.devices[i];
      // --------- quick heating steps ----------
      if (regs.wT != undefined && regs.wT != 0 && regs.H == 0) {
        quickHeatingSteps.push(
          new ClassQuickHeatingStep({ regs, device, wave: this.firstWave })
        ); //push
      } //if (regs.wT != undefined || regs.wT != 0 || regs.H == 0)

      // ---------- heating step ----------
      let hs = new ClassHeatingStep({ regs, device });
      heatingSteps.push(hs); //push
      if (i == 0) {
        // завдання точка "Нагрівання"
        stepTaskPoints.push({
          // time = undefined, коли гріти максимально швидко і час невизначений
          time: regs.H == 0 ? undefined : parseInt(regs.H),
          value: regs.tT,
          errVmin: hs.errTmin,
          errVmax: hs.errTmax,
        });
      }

      // ---------- holding step ----------
      hs = new ClassHoldingStep({ regs, device });
      holdingSteps.push(hs); //push
      if (i == 0) {
        // завдання точка "Витримка"
        stepTaskPoints.push({
          // time = undefined, коли гріти максимально швидко і час невизначений
          time: regs.Y == 0 ? undefined : parseInt(regs.Y),
          value: regs.tT,
          errVmin: hs.errTmin,
          errVmax: hs.errTmax,
        });
      }
    } // for

    // якщо приладів в процесі декілька - запускаємо кожний тип кроку паралельно
    if (quickHeatingSteps.length > 0) {
      if (quickHeatingSteps.length === 1) {
        quickHeatingSteps = quickHeatingSteps[0];
      } else {
        quickHeatingSteps = new ClassStepsParallel({
          tasks: quickHeatingSteps,
          header: {
            ua: `Швидке нагрівання `,
            en: `Quick heating `,
            ru: `Быстрое нагревание `,
          },
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
          header: {
            ua: `Нагрівання `,
            en: `Heating `,
            ru: `Нагревание `,
          },
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
          header: {
            ua: `Витримка `,
            en: `Holding `,
            ru: `Удержание `,
          },
        });
      }
      res.push(holdingSteps);
    }
    // ---------- загальний опис кроку ----------
    let header = `tT=${regs.tT}; H=${regs.H}; Y=${regs.Y}`;
    let comment = `wT=${regs.wT}; errTmin=${regs.errTmin}; errTmax=${
      regs.errTmax
    }; errH=${regs.errH}; regMode=${regs.regMode}; o=${regs.o}; ti=${
      regs.ti == undefined ? "0" : regs.ti
    }; td=${regs.td == undefined ? "0" : regs.td};`;
    res = new ClassStepsSerial({
      id: regs.id,
      header: {
        ua: `Термообробка: ${header}`,
        en: `Heat treatment: ${header}`,
        ru: `Термообработка: ${header}`,
      },
      comment: { ua: `${comment}`, en: `${comment}`, ru: `${comment}` },
      tasks: res,
    });
    res.taskPoints = stepTaskPoints;
    return res; //{ header: { ua: `123`, en: `123`, ru: `123` } };
  }
} //class ClassThermoStep

module.exports = ClassTaskThermal;
