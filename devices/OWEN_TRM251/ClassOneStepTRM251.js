const { test } = require("../../config");
const ClassStepGeneral = require("../../controllers/ClassStep/ClassStepGeneral");
const log = require("../../tools/log");
/**
 * Реалізує крок термообробки для приладу OWEN TRM251
 * @extends ClassStepGeneral
 */

class ClassThermoStepTRM251 extends ClassStepGeneral {
  constructor(props = {}) {
    super(props);
    if (!props.number) {
      throw new Error(this.ln + " props.number is required!");
    }
    if (props.number < 1 && props.number > 5) {
      throw new Error(this.ln + " props.number must be in range 1..5 !");
    }
    if (!props.number) {
      throw new Error(this.ln + " props.number is required!");
    }
    this.number = props.number;
    this.header = {
      ua: `Крок №` + this.number,
      en: `Thermo step no.` + this.number,
      ru: `Шаг №` + this.number,
    };

    this.tT = props.tT ? props.tT : null; // цільова температура для кроку
    this.H = props.H ? props.H : null; // час нагрівання
    this.Y = props.Y ? props.Y : null; // час витримки
  }

  // --------- testState -------------
  async testState() {
    let trace = 1,
      ln = "testProcess::";
    trace ? this.logger("i", ln + `Started`) : null;
    let res = await super.testState();
    // trace ? console.log(ln + `super.res=${res};`) : null;
    if (res == 1) return res;
    let curStep;
    try {
      curStep = await this.device.getRegister("step");
      trace ? console.log("i", ln, `curStep=`, curStep) : null;
      if (curStep > this.number) {
        this.finish();
        return 1; // крок триває
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = ClassThermoStepTRM251;
