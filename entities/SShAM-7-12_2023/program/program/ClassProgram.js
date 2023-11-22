//const router = require("../routes/router");
const pug = require("pug");
const Heating = require("../heatingStep/ClassHeatingStep.js");
const Holding = require("../holdingStep/ClassHoldingStep.js");
const ClassStep = require("../classStep/ClassStep.js");
const log = require("../../../../tools/log.js");
const test = true; //налаштування для режиму тестування

/**
 * Завдання для створення програми
 * @typedef {Object} task
 * @property {string|number} tT - задана температура
 * @property {string|number} heating - хв, час розігрівання
 * @property {string|number} holding - хв, час витримки
 * @property {string|number} Kn - азотний коефіцієнт
 * @property {string|number} Kc - вуглецевий коефіцієнт
 * @property {Object} pid_T - налаштування для основного ТРП
 * @property {string|number} pid_T.td
 * @property {string|number} pid_T.ti
 * @property {string|number} pid_T.o
 * @property {string|number} pid_T.regMode
 */

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
    this.steps = []; // поточна програма
    this.steps[0] = {}; // перший елемент масиву - загальний опис програми
    this.state = {
      // поточний стан процесу
      before: 0, //попередній крок, для перевірки чи можна запускати наступний крок
      step: 0, // поточний крок
      alert: null, // повідомлення в модальному вікні
    };

    /** Головні налаштування програми */
    this.task = {};

    // потрібно запустити вимкнення аварії
  }

  parseHeatingStep(task, entity) {
    // TODO  поки заглушка, тут маємо отримати
    // параметри першої хвилі перерегулювання для вказаної температури
    let { firstWave_T, firstWave_time } = {
      firstWave_T: 50,
      firstWave_time: 10,
    };
    // створюємо завдання для кроку Heating
    let title = `${task.tT} &deg;C;${task.heating}`;
    let props = {
      title: {
        ua: `Нагрівання ${title}хв`,
        en: `Heating ${title}min`,
        ru: `Нагревание ${title}мин`,
      },
      taskT: task.tT - firstWave_T,
      errT: { min: 0, max: 100 },
      H: task.heating - firstWave_time,
      errH: 0,
      periodCheck: 2,
      getT: async () => {
        return entity.devices.retortTRP.getT();
      },
      wave: {
        period: test ? 1 : 60,
        dT: 0.1,
        points: 10,
      },
    };

    // перед початком кроку програмуємо прилади
    props.beforeStart = async () => {
      // --- піч
      await entity.devices.furnaceTRP.stop();
      let regs = {
        tT: entity.maxT,
        H: 0, // не обмежуємо швидкість
        Y: 0, // утримуємо до завершення нагрівання реторти
        regMode: 1, // щоб по інерції не заскакував вище ОГР
        o: 5, // почне знижувати потужність за 100/5=20С до заданої
        td: 0,
        ti: 0,
      };
      await entity.devices.furnaceTRP.setRegs(regs);
      await entity.devices.furnaceTRP.start();
      // --- реторта
      await entity.devices.retortTRP.stop();
      regs = {
        tT: props.taskT,
        H: props.H,
        Y: 0, // утримуємо до завершення нагрівання реторти
        regMode: 2, // ПОЗ, оскільки ми понизили температуру та скоротили час розігріву: див. firstWave_T, firstWave_time
        o: 10,
        td: 0,
        ti: 0,
      };
      await entity.devices.retortTRP.setRegs(regs);
      await entity.devices.retortTRP.start();
    }; // beforeStart

    return new Heating(props);
  }

  parseHoldingStep(task, entity) {
    // TODO заглушка, в цьому місці повинна бути функція таблиця для отримання коеф. з таблиці,
    // що автоматично/вручну підлаштовується  під піч/садку
    this.pid = task.pid ? task.pid : { o: 10, dt: 0, di: 0 };
    // створюємо завдання для кроку Holding
    let title = `${task.tT} &deg;C;${task.holding}`;

    let params = {
      title: {
        ua: `Витримка ${title}хв`,
        en: `Holding ${title}min`,
        ru: `Удержание ${title}мин`,
      },
      taskT: task.tT,
      errT: { min: -25, max: 25 },
      // якщо азотування - гріємо доки не надійде команда стоп від процесу азотування
      // якщо просто нагрівання без азотування (Кн=0), то використовуємо: витримку з завдання + 5хв
      // додаємо 5 хв, щоб програмно зупинити + коригування для багатозонних печей + самозупинка у випадку втрати звязку
      Y: parseInt(task.Kn) ? 0 : task.holding + 5,
      periodCheckT: 2,

      getT: async () => {
        return entity.devices.retortTRP.getT();
      },
    };
    return new Holding(params);
  }

  /** готує програму для виконання
   * @param {task} task
   */
  async setProgram(task, entity) {
    let trace = 1,
      ln = this.ln + `setProgram(${task})`;
    this.task = task;
    this.state.before = this.state.step = 0;
    // позиція 0 зарезервована під загальний опис програми
    // TODO потрібно додати обробку опису програми
    this.steps = [{}];

    this.steps.push(this.parseHeatingStep(task, entity));
    this.steps.push(this.parseHoldingStep(task, entity));

    //let heating = new Heating();
    //this.program.push();
  }

  /** запускає крок step[=0]  */
  async start(step = 1) {
    let trace = 1,
      ln = this.ln + `start(${step})::`;
    if (this.steps.length <= 1) {
      this.error({
        ua: `Не завантажена програма`,
        en: `Program wasn't loaded`,
        ru: `Программа не загружена`,
      });
    }
    this.state.step = step - 1; // step=0 contains the description of program
    this.next();
    return await super.start();

    for (let i = step; i < this.steps.length; i++) {
      let step = this.steps[i];
      if (!Array.isArray(step)) {
        step = [step];
      }
      for (let j = 0; j < step.length; j++) {
        await step[j].start();
      }
      trace
        ? log(
            "",
            ln,
            ` ========= Start(${i}). ${this.steps[i].title} ==========`
          )
        : null;
      if (trace) {
        log("i", ln, `this.steps[i]=`);
        console.dir(this.steps[i]);
      }

      // if (typeof step === "Array") {
      //   await Promise.all(step);
      // } else {
      //await step.start();
      // }
    } //for
    return 1;
  }
  /** запускає наступний крок */
  async next() {
    let trace = 1,
      ln = this.ln + `next()::`;
    this.state.step += 1;
  }
  /** зупиняє виконання програми */
  async stop() {
    let trace = 1,
      ln = this.ln + `stop()`;
  }

  htmlFull = (entity) => {
    return pug.renderFile(__dirname + "/views/process_full.pug", {
      entity: entity,
    });
  };
}

module.exports = ClassProgram;
