const ClassStep = require("./ClassStepGeneral.js");
const dummyPromise = require("../../tools/dummy.js").dummyPromise;

/**
 * Фальш крок, що імітує реальний крок
 */

class ClassDummyStep extends ClassStep {
  /**
   *
   * @param {*} props
   * @property {Number} props.id - id
   * @property {Number} props.delay=5 - s, період очікування
   * @property {Boolean} props.randomize=true - рандомізувати період очікування в межах:  0..props.delay
   *
   */
  constructor(props) {
    // let id =
    //   "id_" +
    //   (new Date().getTime() + Math.round(Math.random() * 100))
    //     .toString()
    //     .slice(-5);
    // props.id = props.id ? props.id : id;

    super(props);

    // this.header = this.header
    // ? props.header
    // : {
    //     ua: `Імітація кроку ${this.id}`,
    //     en: `Dummy step ${this.id}`,
    //     ru: `Симулятор шага ${this.id}`,
    //   };

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
