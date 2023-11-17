let ClassStep = require("./classStep/ClassStep.js");
class ClassHeatingProcess extends ClassStep {
  constructor(props) {
    super({ title: { ua: `Термообробка`, en: `Thermprocess`, ru: `` } });

    // заданий список терморегуляторів Arr of devices
    if (typeof props.devices[0].getT != "function") {
      throw new Error(
        "props.devices[0].getT must be a function, but received: " +
          typeof props.devices[0].getT
      );
    }
    this.devices = props.deviceStart;

    // задана температура
    this.taskT = props.taskT
      ? props.taskT
      : (function () {
          throw new Error("taskT must be defined! taskT=" + props.taskT);
        })();

    // хв, тривалість розігрівання, якщо 0 = максимально швидко
    this.H = props.H ? props.H : 0;

    // хв, тривалість витримки, якщо 0 = до зупинки вручну
    this.H = props.Y ? props.Y : 0;

    // максимальне відхилення температури від розрахункової
    this.errT = props.errT ? props.errT : { min: undefined, max: +100 };

    // хв, помилка часу наростання, щоб помітити проблеми з нагріванням
    this.errH = props.errH ? props.errH : 60;

    // функція від taskT, закид першої хвилі перерегулювання
    this.waitT = props.waitT
      ? props.waitT
      : () => {
          return 10;
        };
    // функція від taskT, тривалість першої хвилі перерегулювання
    this.waitH = props.waitH
      ? props.waitH
      : () => {
          return 10;
        };
    // асинхронна функція що виконується перед початком кроку
    // наприклад: додаткове налаштування та запуск обмежуючого терморегулятора
    this.beforeStart =
      typeof props.beforeStep != "function" ? props.beforeStep : null;
    // асинхронна функція що виконується після закінчення кроку
    // наприклад: додаткове зупинка обмежуючого терморегулятора
    this.beforeStart =
      typeof props.beforeStep != "function" ? props.beforeStep : null;
  } //constructor

  async heating(currT) {}

  async start() {
    super.start();
    await this.beforeStart();
  }
}
