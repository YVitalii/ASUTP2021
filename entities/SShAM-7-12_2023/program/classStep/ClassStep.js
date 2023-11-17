/** Загальний клас кроку програми, соновна логіка та влаштування */
class ClassStep {
  constructor(props = {}) {
    let trace = 1;
    this.ln = "ClassStep()::";
    this.state = "waiting"; // поточний стан кроку, перелік можливих станів: ["waiting","going","finished","error"]
    this.err = null; // зберігає опис помилки
    /** Опис кроку, виводиться в полі програми */
    this.title = props.title
      ? props.title
      : { ua: `Невизначено`, en: `Undefined`, ru: `` };
    this.ln = "ClassStep(" + this.title.ua + ")::";
  }

  logger(level, msg) {
    log(level, this.ln, "[", new Date().toLocaleTimeString() + "]::" + msg);
  }

  start() {
    logger("w", "Started!!");
    this.state = "going";
  }

  stop() {
    logger("w", "Stoped!!");
    this.state = "stoped";
  }

  finish() {
    logger("w", "Finished!!");
    this.state = "finished";
  }
  error(err) {
    logger("e", "Happen an Error!!");
    this.state = "error";
    throw new Error(err);
  }
  async testState() {
    // якщо крок завершено повертаємо Успіх
    if (this.state == "finished") {
      return 1;
    }
    // якщо виникла помилка кидаємо помилку
    if (this.state == "error") {
      throw new Error("");
    }
    if (this.state == "going") {
      // якщо крок в стані виконання, плануємо наступну перевірку
      process.nextTick(() => {
        this.testState();
      });
    }
    if (this.state == "waiting") {
      // якщо очікування плануємо наступну перевірку через 3 сек
      setTimeout(() => {
        this.testState();
      }, 3000);
    }
    // стан не визначений
    this.error({
      ua: `Невизначений стан кроку` + this.state,
      en: `Undefined state of step` + this.state,
      ru: ``,
    });
  }
}

module.exports = ClassStep;
