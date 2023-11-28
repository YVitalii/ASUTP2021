//const router = require("../routes/router");
const pug = require("pug");
const Heating = require("../heatingStep/ClassHeatingStep.js");
const Holding = require("../holdingStep/ClassHoldingStep.js");
const ClassStep = require("../classStep/ClassStep.js");
const log = require("../../../../tools/log.js");
const test = true; //налаштування для режиму тестування

/**
 * Завдання для створення кроку термічної програми
 * @typedef {Object} task
 * @property {string|number} tT - задана температура
 * @property {string|number} H=0 - хв, час розігрівання
 * @property {string|number} Y=0 - хв, час витримки
 * @property {string|number} errH=30 - хв, помилка часу розігрівання
 * @property {string|number} waveT=0 - °С, перерегулювання температури першої хвилі
 * @property {string|number} waveH=0 - хв, орієнтовна тривалість півхвилі першої пів-хвилі
 * @property {Object} errT - налаштування коридору температури
 * @property {string|number} errT.min = - 50 -  
 * @property {string|number} errT.min = + 50 - 
 * @property {string} regMode="pid" / "pos" - тип регулювання ПІД / Позиційний
 * @property {Object} pid - налаштування ПІД закону
 * @property {string|number} pid.td 
 * @property {string|number} pid.ti
 * @property {string|number} pid.o
 
 */

class ClassProgram extends ClassStep {
  /**
   * Конструктор програми
   * @param {task} props
   */

  constructor(props) {
    super(props);

    this.maxT = 750; //TODO максимальна температура в РЗ печі

    this.ln = "ClassThermStep()::";
    let trace = 1,
      ln = this.ln + "constructor()";
    this.tT = {
      id: "tT",
      type: "number",
      value: props.tT ? props.tT : 20,
      header: "T,°C",
      title: {
        ua: `Цільова температура`,
        en: `Task temperature`,
        ru: `Заданная температура`,
      },
      min: 20,
      max: this.maxT,
    };
    this.H = {
      id: "Н",
      type: "time",
      header: "Н",
      value: props.H ? props.H : 0,
      title: {
        ua: `Тривалість нагрівання`,
        en: `Heating delay`,
        ru: `Длительность нагревания`,
      },
      min: 0,
      max: 5500,
    };
    this.Y = {
      id: "Y",
      type: "time",
      header: "Y",
      value: props.Y ? props.Y : 0,
      title: {
        ua: `Тривалість витримки температури`,
        en: `Holding delay`,
        ru: `Длительность удержания температуры`,
      },
      min: 0,
      max: 5500,
    };
    this.errH = {
      id: "errH",
      header: "errH",
      type: "number",
      value: props.errH ? props.errH : 0,
      title: {
        ua: `Помилка тривалості нагрівання, хв, 0=вимкнути`,
        en: `Error of heating duration, min, 0=disable`,
        ru: `Ошибка длительности времени нагревания, мин. 0=отключить`,
      },
      min: 0,
      max: 120,
      default: 30,
    };
    this.firstWave_T = {
      id: "firstWave_T",
      header: "wT",
      type: "number",
      value: this.wave.dT,
      title: {
        ua: `Перерегулювання першої хвилі, °С`,
        en: `Overheating for first wave, °С`,
        ru: `Перерегулирование первой волны, °С`,
      },
      min: 0,
      max: 200,
      default: 10,
    };
    this.firstWave_time = {
      id: "firstWave_time",
      header: "wH",
      type: "number",
      value: 5,
      title: {
        ua: `Орієнтовна тривалість першої хвилі перерегулювання, хв`,
        en: `Approximate duration of first wave, min`,
        ru: `Ориентировочная длительность первой волны, мин`,
      },
      min: 0,
      max: 120,
      default: 10,
    };
    this.errTmin = {
      id: "errTmin",
      header: "errTmin",
      type: "number",
      value: props.errTmin ? props.errTmin : -50,
      title: {
        ua: `Максимальне відхилення температури вниз, хв`,
        en: `Limit of low temperature, min`,
        ru: `Максимальное отклонение температуры вниз, мин`,
      },
      min: 0,
      max: -100,
    };
    this.errTmax = {
      id: "errTmax",
      header: "errTmax",
      type: "number",
      value: props.errTmin ? props.errTmin : -50,
      title: {
        ua: `Максимальне відхилення температури вниз, хв`,
        en: `Limit of low temperature, min`,
        ru: `Максимальное отклонение температуры вниз, мин`,
      },
      min: 0,
      max: -100,
    };

    // поточна програма
    this.program = {};
    // кроки програми. Один крок = массив підкроків що можуть виконуватися паралельно
    // Наприклад: [[step1,step2],[step3],]
    this.program.steps = [];
    // description of program
    this.program.description = {};

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
    let title = `${task.tT} &deg;C;${task.H}`;
    let props = {
      title: {
        ua: `Нагрівання ${title}хв`,
        en: `Heating ${title}min`,
        ru: `Нагревание ${title}мин`,
      },
      taskT: task.tT - firstWave_T > 0 ? task.tT - firstWave_T : 0,
      errT: { min: 0, max: 100 },
      H: task.H - firstWave_time > 0 ? task.H - firstWave_time : 0,
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
    this.program.description = {
      title: { ua: `Програма`, en: `Program`, ru: `Программа` },
    };
    if (task.Kn > 0) {
      if (task.Kc > 0) {
        this.program.type = {
          ua: `Нітрокарбюризація`,
          en: `Nitrocarburization`,
          ru: `Нитрокарбюризация`,
        };
      }
      this.program.type = {
        ua: `Азотування`,
        en: `Nitriding`,
        ru: `Азотирование`,
      };
    } else {
      this.program.type = {
        ua: `Термообробка`,
        en: `Thermal Treatment`,
        ru: `Термообработка`,
      };
    }
    // очищуємо список кроків
    this.program.steps = [];
    // створюємо кроки програми
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

  htmlFull = (entity) => {
    return pug.renderFile(__dirname + "/views/program_full.pug", {
      entity: entity,
    });
  };
}

module.exports = ClassProgram;
