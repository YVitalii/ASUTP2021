const router = require("../routes/programRouter");
const pug = require("pug");
// const Heating = require("../heatingStep/ClassHeatingStep.js");
// const Holding = require("../holdingStep/ClassHoldingStep.js");
const ClassStep = require("../classStep/ClassStep.js");
const log = require("../../../../tools/log.js");
const test = true; //налаштування для режиму тестування

// /**
//  * Завдання для створення програми
//  * @typedef {Object} task
//  * @property {string|number} tT - задана температура
//  * @property {string|number} H - хв, час розігрівання
//  * @property {string|number} Y - хв, час витримки
//  * @property {string|number} Kn - азотний коефіцієнт
//  * @property {string|number} Kc - вуглецевий коефіцієнт
//  * @property {Object} pid_T - налаштування для основного ТРП
//  * @property {string|number} pid_T.td
//  * @property {string|number} pid_T.ti
//  * @property {string|number} pid_T.o
//  * @property {string|number} pid_T.regMode
//  */

class ClassProgram extends ClassStep {
  /**
   * Конструктор програми
   * @param {task} props
   */
  constructor(props) {
    super(props);
    this.ln = "ClassProgram()::";
    let trace = 1,
      ln = this.ln + "constructor()";

    // массив завдань як на веб. сторінці
    this.tasks = [];
    // this.task.registeredSteps = {};
    //  his.task.registeredSteps[Heating.id] = Heating;

    // TODO створити автоматичне завантаження останньої програми з файлу
    this.tasks = [
      {
        // загальний опис програми
        type: "description",
        title: "Програма 01",
        note: "По замовчуванню.",
      },
      {
        id: "preparation",
      },
      {
        type: "heating",
        tT: 520,
        H: 0,
        errH: 30,
        wT: 50,
        wH: 10,
        errTmin: -15,
        errTmax: 25,
        regMode: "pid",
        pid_td: 0,
        pid_ti: 0,
        pid_o: 0,
      },

      {
        type: "nitriding",
        Kn: 0,
        //Y: 12*60,
        pid_ti: 0,
        pid_td: 0,
        pid_o: 0,
      },
      {
        type: "nitrocarburizing",
        Kc: 0,
        //Y: 12*60,
        pid_ti: 0,
        pid_td: 0,
        pid_o: 0,
      },
    ];
    this.program = {};
    // кроки програми. Один крок = массив підкроків що можуть виконуватися паралельно
    // Наприклад: [[step1,step2],[step3],]
    this.program.steps = [];

    // перетворюємо програму в масив кроків
    this.setProgram(this.tasks);

    // поточний стан процесу
    this.state = {
      // id - зарезервовано для керування задачею ???Додати опис бо незрозуміло
      before: 0, //попередній крок, для перевірки чи можна запускати наступний крок
      step: 0, // поточний крок
      //alert: null, // повідомлення в модальному вікні
    };

    //TODO потрібно запустити вимкнення аварії
  }

  // parseQuickHeatingStep(task, entity) {
  //   // створюємо завдання для кроку Heating
  //   let props = {
  //     tT: task.tT - task.wT > 0 ? task.tT - task.wT : 0,
  //     errTmin: 0,
  //     errTmax: 100,
  //     wT: task.wT,
  //     H: task.H - task.wH > 0 ? task.H - task.wH : 0,
  //     errH: 0,
  //     periodCheck: 2,
  //     getT: async () => {
  //       return entity.devices.retortTRP.getT();
  //     },
  //     wave: {
  //       period: test ? 1 : 60,
  //       dT: 0.1, // якщо за 6 хв температура зросла менш ніж на 1 *С, рахуємо - фініш
  //       points: 10,
  //     },
  //   };
  //   let title = `${props.tT} &deg;C;${props.H}`;
  //   props.title = {
  //     ua: `Швидке нагрівання ${title} хв`,
  //     en: `Quick heating ${title} min`,
  //     ru: `Быстрый нагрев ${title} мин`,
  //   };

  //   // перед початком кроку програмуємо прилади
  //   props.beforeStart = async () => {
  //     // --- піч
  //     await entity.devices.furnaceTRP.stop();
  //     let regsTRP = {
  //       tT: entity.maxT,
  //       H: 0, // не обмежуємо швидкість
  //       Y: 0, // утримуємо до завершення нагрівання реторти
  //       regMode: 1, // щоб по інерції не заскакував вище ОГР
  //       o: 5, // почне знижувати потужність за 100/5=20С до tT
  //       td: 0,
  //       ti: 0,
  //     };
  //     await entity.devices.furnaceTRP.setRegs(regsTRP);
  //     await entity.devices.furnaceTRP.start();
  //     // --- реторта
  //     await entity.devices.retortTRP.stop();
  //     regsTRP = {
  //       tT: props.tT,
  //       H: props.H,
  //       Y: 0, // утримуємо до завершення нагрівання реторти
  //       regMode: 2, // ПОЗ-закон, оскільки ми понизили температуру та скоротили час розігріву: див. wT, wH
  //       o: 5,
  //       td: 0,
  //       ti: 0,
  //     };
  //     await entity.devices.retortTRP.setRegs(regs);
  //     await entity.devices.retortTRP.start();
  //   }; // beforeStart

  //   return new Heating(props);
  // }

  // // повільне догрівання до tT по ПІД закону
  // parsePidHeatingStep(task, entity) {
  //   // створюємо завдання для кроку Heating
  //   let props = {
  //     tT: task.tT,
  //     errT: { min: task.errTmin, max: task.errTmax },
  //     wT: 0,
  //     H: 0,
  //     errH: 0,
  //     periodCheck: 2,

  //     getT: async () => {
  //       return entity.devices.retortTRP.getT();
  //     },
  //   };

  //   let title = `${props.tT} &deg;C;${props.H}`;
  //   props.title = {
  //     ua: `Догрівання ${title} `,
  //     en: `Finishing heating ${title} min`,
  //     ru: `Догревание ${title} мин`,
  //   };
  //   // перед початком кроку програмуємо прилади
  //   props.beforeStart = async () => {
  //     // --- піч --------
  //     await entity.devices.furnaceTRP.stop();
  //     let regsTRP = {
  //       tT: entity.maxT,
  //       H: 0, // не обмежуємо швидкість
  //       Y: 0, // утримуємо до завершення нагрівання реторти
  //       regMode: 1, // щоб по інерції не заскакував вище ОГР
  //       o: 5, // почне знижувати потужність за 100/5=20С до tT
  //       td: 0,
  //       ti: 0,
  //     };
  //     await entity.devices.furnaceTRP.setRegs(regsTRP);
  //     await entity.devices.furnaceTRP.start();
  //     // --- реторта
  //     await entity.devices.retortTRP.stop();
  //     regsTRP = {
  //       tT: props.tT,
  //       H: props.H,
  //       Y: 0, // утримуємо до зовнішньої команди "Стоп"
  //       regMode: 1, // ПІД-закон, оскільки ми понизили температуру та скоротили час розігріву: див. wT, wH
  //       o: task.pid_o,
  //       td: task.pid_td,
  //       ti: task.pid_ti,
  //     };
  //     await entity.devices.retortTRP.setRegs(regs);
  //     await entity.devices.retortTRP.start();
  //   }; // beforeStart
  //   return new Heating(props);
  // }

  // parseHoldingStep(task, entity) {
  //   // створюємо завдання для кроку Holding

  //   let title = `${task.tT} &deg;C;${task.holding}`;

  //   let params = {
  //     title: {
  //       ua: `Витримка ${title}хв`,
  //       en: `Holding ${title}min`,
  //       ru: `Удержание ${title}мин`,
  //     },
  //     tT: task.tT,
  //     errT: { min: -25, max: 25 },
  //     // якщо азотування - гріємо доки не надійде команда стоп від процесу азотування
  //     // якщо просто нагрівання без азотування (Кн=0), то використовуємо: витримку з завдання + 5хв
  //     Y: parseInt(task.Kn) ? 0 : task.holding,
  //     periodCheckT: 2,
  //     getT: async () => {
  //       return entity.devices.retortTRP.getT();
  //     },
  //   };

  //   // TODO додаємо 5 хв, щоб програмно зупинити ТРП, призначено :
  //   //    - для очікування завершення процесу в усіх приладах для багатозонних печей
  //   //    - самозупинка ТРП у випадку втрати звязку з АСУ
  //   //    - для тестування додаємо 0,1хв=6сек - щоб довго не чекати

  //   return new Holding(params);
  // }

  /** готує програму для виконання
   * @param {task} tasks
   */
  setProgram(tasks, entity) {
    let trace = 1,
      ln = this.ln + `setProgram(${JSON.stringify(tasks)})`;
    this.tasks = tasks;
    this.state.before = this.state.step = 0;
    log("w", ln, "Started !");
    // очищуємо список кроків
    this.program.steps = [];
    // список пунктів на кроці "Підготовка"
    let checkList = [];
    checkList.push("Кришка печі закрита");
    checkList.push("Затискачі кришки встановлені");
    checkList.push("Вентилятор працює");
    checkList.push('Перемикач керування в положенні "Газова стійка"');
    checkList.push("Охолодження реторти та кришки ввімкнено");
    // визначаємо тип кроку
    if (tasks[2].Kn > 0) {
      this.program.type = {
        ua: `Азотування`,
        en: `Nitriding`,
        ru: `Азотирование`,
      };
      checkList.push("Тиск азоту в нормі");
      checkList.push("Тиск аміаку в нормі");
      checkList.push(
        'Вентилі керування ротаметрів "Азот" та "Аміак" відкрито повністю'
      );
      checkList.push("Вентиль ручної аварійної подачі азоту закритий");
      checkList.push("Утилізатор. Нагрівання ввімкнено.");

      if (tasks[3].Kc > 0) {
        this.program.type = {
          ua: `Нітрокарбюризація`,
          en: `Nitrocarburization`,
          ru: `Нитрокарбюризация`,
        };
        checkList.push("Тиск СО2 в нормі");
        checkList.push(
          'Витрата на ротаметрі "СО2" виставлена на рівні 0,5 м3/год'
        );
      }
    } else {
      this.program.type = {
        ua: `Термообробка`,
        en: `Heat treatment`,
        ru: `Термообработка`,
      };
    }

    // створюємо кроки програми
    // this.program.steps.push(this.parseQuickHeatingStep(tasks[2], entity));
    // this.program.steps.push(this.parsePidHeatingStep(tasks[2], entity));
    //this.program.steps.push(this.parseHoldingStep(tasks[2], entity));
    //let heating = new Heating();
    //this.program.push();
  }

  /** запускає крок step[=1]  */
  async start(step = 0) {
    let trace = 1,
      ln = this.ln + `start(${step})::`;
    if (this.program.steps.length <= 1) {
      this.error({
        ua: `Не завантажена програма`,
        en: `Program wasn't loaded`,
        ru: `Программа не загружена`,
      });
    }
    // start from step 0 for using  next()
    this.state.step = step - 1;
    this.state.step = this.state.step < -1 ? -1 : this.state.step;
    // call next();
    this.next();
    // return Promise()
    return await super.start();
  }

  /** запускає наступний крок */
  async next() {
    let trace = 1,
      ln = this.ln + `next()::`;
    // якщо стан не going - тихо виходимо
    if (
      (this.state._id == "waiting") |
      (this.state._id == "stoped") |
      (this.state._id == "finished")
    ) {
      return 1;
    }
    // next step
    this.state.step += 1;
    if (this.state.step >= this.program.steps.length) {
      // ---------- program finished --------------
      this.state.step = 0;
      await this.finish({
        ua: `Програму закінчено`,
        en: `Program completed`,
        ru: `Программа завершена`,
      });
      return 1;
    }
    // Отримуємо поточний крок
    let step = this.program.steps[this.state.step];
    // якщо крок не масив - перетворюємо в масив для однакових дій
    step = Array.isArray(step) ? step : [step];

    // Формуємо масив функцій запуску кроків
    let starts = [];
    for (let i = 0; i < step.length; i++) {
      this.logger(
        "w",
        `next():========= step(${this.state.step}). ${step[i].title.en}. Started! ==========`
      );
      starts.push(step[i].start());
    }
    if (trace) {
      log("", ln, `starts=`);
      console.dir(starts);
    }
    await Promise.all(starts);
    this.next();
  } //next()

  /** зупиняє виконання програми */
  async stop() {
    let trace = 1,
      ln = this.ln + `stop()`;
  }

  getFullHtml = (entity) => {
    let html = "<h4> Compiled program </h4>";
    // html = entity.tasksManager.getFullHtml();
    // html = pug.renderFile(__dirname + "/views/full.pug", {
    //   tasks: html,
    //   //program: entity.program,
    // });
    return html;
  };
  /**
   * Створює елемент, що відображає скомпільовану програму, та поточний крок
   * Використовується для головної сторінки
   * @param {*} entity  - об'экт сутності (печі)
   * @returns
   */
  htmlCompact = (entity) => {
    return pug.renderFile(__dirname + "/views/compact.pug", {
      entity: entity,
    });
  };
  //static router;
}

// роутер обробки гілки program
ClassProgram.router = router;

module.exports = ClassProgram;
