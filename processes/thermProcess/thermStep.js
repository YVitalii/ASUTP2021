// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;

/**
 * @typedef {Object} task  - Объект, описывающий задачу для термического процесса
 * @param {Number} [task.taskT =20] - °С, требуемая (заданная) температура шага
 * @param {Number} [task.heatTime =0] - мин., время разогрева печи до заданной температуры **taskT**; при **0**  максимально быстро
 * @param {Number} [task.holdTime=0] - мин., время выдержки при указанной температуре; при **0**  максимально долго, пока не выключат вручную
 * @param {Number} [task.minT=-5] - °С, нормальный разброс температуры, **минимум**
 * @param {Number} [task.maxT=5]  °С, нормальный разброс температуры, **максимум**
 * @param {Number} [task.timeErr=30]  мин., ошибка времени нарастания; по истечению времени **task.heatTime + timeErr** будет ошибка
 * @param {Number} [task.state=0] - текущее состояние процесса
 */

let task = {
  startTime: null,
  taskT: 20,
  heatTime: 0,
  holdTime: 0,
  minT: -5,
  maxT: +5,
  timeErr: 20,
  state: 0,
};
/**

*/
let states = [
  { description: { ru: "Ожидание", ua: "Очікування", en: "Waiting" } },
  {
    description: {
      ru: "Пуск нагрева",
      ua: "Старт нагрева",
      en: "Start heating",
    },
  },
  { description: { ru: "Нагрев", ua: "Розігрів", en: "Heating" } },
  {
    description: {
      ru: "Пуск выдержки",
      ua: "Старт витримки",
      en: "Start holding",
    },
  },
  { description: { ru: "Выдержка", ua: "Витримка", en: "Holding" } },
  {
    description: { ru: "Цикл закончен", ua: "Цикл завершено", en: "Finished" },
  },
];

/**
 * Класс, обрабатывающий один шаг термического процесса
 */
class ThermStep {
  /**
   *
   * @param {Object.test} args
   */
  constructor(args) {
    // ----------- настройки логгера локальные --------------
    let logN = logName + "new ThermStep():";
    let trace = 1;
    trace = gTrace != 0 ? gTrace : trace;
    trace ? log("i", logN, "Started") : null;
    trace ? log("i", logN, "args=") : null;
    trace ? console.dir(args) : null;
    // ------------------------------------------------------
    /**
     * @param {Array.task} prop Параметры
     */
    this.prop = task; // задаем  настройки по умолчанию
    // проверяем наличие полей в аргументах конструктора
    if (args) {
      for (var key in this.prop) {
        trace ? log("i", logN, "args[", key, "]=", args[key]) : null;

        // если поле указано в аргументах конструктора
        if (args[key]) {
          // переносим в параметры шага
          this.prop[key] = args[key];
        }
      } //for
    } // if (args)

    trace ? log("i", logN, "this.prop =", this.prop) : null;
  } //constructor

  //   addStep(step) {
  //     // ----------- настройки логгера локальные --------------
  //     let logN = logName + "addStep:";
  //     let trace = 1;
  //     trace = gTrace != 0 ? gTrace : trace;
  //     trace ? log("i", logN, "Started") : null;
  //     this.steps.push(step);
  //     trace ? log("i", logN, " this.steps=", this.steps) : null;
  //   }
} //class

module.exports = ThermStep;

if (!module.parent) {
  console.dir(module);
  console.log("require.main");
  console.log(require.main);
  let thermProcess = new ThermProcess();
}
