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
    this.number = props.number;
    this.header = {
      ua: `Крок №` + this.number,
      en: `Thermo step no.` + this.number,
      ru: `Шаг №` + this.number,
    };
  }
  async testState() {
    let trace = 0,
      ln = "testProcess::";
    trace ? this.logger("i", ln + `Started`) : null;
    let res = super.testState();
    if (res != 0) return res;
    let curStep = await this.device.getRegister("step");
    trace ? this.logger("i", ln, `curStep=`, curStep) : null;
  }
}
