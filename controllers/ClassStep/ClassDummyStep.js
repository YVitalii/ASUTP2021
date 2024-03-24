const ClassStep = require("./ClassStepGeneral.js");
const dummyPromise = require("../../tools/dummy.js").dummyPromise;

/**
 * Фальш крок, що імітує реальний крок
 */

class ClassDummyStep extends ClassStep {
  /**
   *
   * @param {*} props
   * @property {} props.delay=5 - s, період очікування
   * @property {} props.randomize=true - рандомізувати період очікування в межах:  0..props.delay
   *
   */
  constructor(props) {
    let id = new Date().getTime().toString().slice(-5);
    props.header = props.header
      ? props.header
      : {
          ua: `Імітація кроку ${id}`,
          en: `Dummy step ${id}`,
          ru: `Симулятор шага ${id}`,
        };

    super(props);
    props.randomize = props.randomize === undefined ? true : props.randomize;
    this.delay = Math.round(
      (props.delay ? props.delay : 5) *
        1000 *
        (props.randomize ? Math.random() : 1)
    );
  } // constructor

  async start() {
    setTimeout(() => {
      this.finish();
    }, this.delay);
    return await super.start();
  }
}

module.exports = ClassDummyStep;
