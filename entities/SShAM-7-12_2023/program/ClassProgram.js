const router = require("./routes/router");
const pug = require("pug");

/**
 * Завдання для створення програми
 * @typedef {Object} task
 * @property {string|number} tT - задана температура
 * @property {string|number} heating - час розігрівання
 * @property {string|number} holding - час витримки
 * @property {string|number} Kn - азотний коефіцієнт
 * @property {string|number} Kc - вуглецевий коефіцієнт
 */

class ClassProgram {
  /**
   * Конструктор програми
   * @param {task} props
   */
  constructor(props) {
    this.ln = "ClassProgram()::";
    let trace = 1,
      ln = this.ln + "constructor()";
    this.program = []; // поточна програма
    this.program[0] = {}; // перший елемент масиву - загальний опис програми
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

  /** зупиняє виконання програми
   * @param {task} task
   */
  async setProgram(task) {
    let trace = 1,
      ln = this.ln + `setProgram(${step})`;
    this.program = [];
    this.program.push();
  }

  /** запускає крок step[=0]  */
  async start(step = 0) {
    let trace = 1,
      ln = this.ln + `start(${step})`;
  }
  /** запускає наступний крок */
  async next() {
    let trace = 1,
      ln = this.ln + `next()`;
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

module.exports = MainProcess;
