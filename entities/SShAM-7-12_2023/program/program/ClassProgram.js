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
    // поточна програма
    this.program = {};
    // кроки програми. Один крок = массив підкроків що можуть виконуватися паралельно
    // Наприклад: [[step1,step2],[step3],]
    this.program.steps = [];
    // description of program
    this.program.note = {};

    this.state = {
      // поточний стан процесу
      // id - зарезервовано для керування задачею
      before: 0, //попередній крок, для перевірки чи можна запускати наступний крок
      step: 0, // поточний крок
      //alert: null, // повідомлення в модальному вікні
    };

    /** Головні налаштування програми */
    this.task = {};

    //TODO потрібно запустити вимкнення аварії
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
      Y: parseInt(task.Kn) ? 0 : task.holding,
      periodCheckT: 2,
      getT: async () => {
        return entity.devices.retortTRP.getT();
      },
    };

    // TODO додаємо 5 хв, щоб програмно зупинити ТРП, призначено :
    //    - для очікування завершення процесу в усіх приладах для багатозонних печей
    //    - самозупинка ТРП у випадку втрати звязку з АСУ
    //    - для тестування додаємо 0,1хв=6сек - щоб довго не чекати

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

    // TODO потрібно додати обробку опису програми
    this.program.note = {
      title: { ua: `Програма`, en: `Program`, ru: `Программа` },
    };

    this.program.steps = [];

    this.program.steps.push(this.parseHeatingStep(task, entity));
    this.program.steps.push(this.parseHoldingStep(task, entity));

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
      (this.state.id == "waiting") |
      (this.state.id == "stoped") |
      (this.state.id == "finished")
    ) {
      return 1;
    }
    // next step
    this.state.step += 1;
    if (this.state.step >= this.program.steps.length) {
      // program finished
      this.state.step = 0;
      this.finish({
        ua: `Програму закінчено`,
        en: `Program completed`,
        ru: `Программа завершена`,
      });
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

  htmlFull = (entity) => {
    return pug.renderFile(__dirname + "/views/process_full.pug", {
      entity: entity,
    });
  };
}

module.exports = ClassProgram;
