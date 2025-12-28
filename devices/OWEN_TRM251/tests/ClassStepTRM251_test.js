// cd ./devices/OWEN_TRM251/
// supervisor  --extensions 'js' --timestamp --no-restart-on exit ./tests/ClassStepTRM251_test.js

const ClassThermoStepTRM251 = require("../ClassOneStepTRM251");
const ClassGeneral = require("../../../ClassGeneral");

class fakeTPM251 extends ClassGeneral {
  constructor(props = {}) {
    props.id = "fakeTPM251";
    super(props);
    this.stepCounter = 0;
    this.step = 1;
  } //constructor
  async getRegister(regName) {
    let trace = 0,
      ln = this.ln + `getRegister(${regName})::`;
    if (regName == "step") {
      trace
        ? console.log(
            ln + `this.step=${this.step}, this.stepCounter=${this.stepCounter}`
          )
        : null;
      this.stepCounter++;
      if (this.stepCounter > 5) {
        this.step++;
        this.stepCounter = 1;
        if (this.step > 5) this.step = 5;
      }
      return this.step;
    } // if regName="step"
    throw new Error(`fakeTPM251: unknown register ${regName}`);
  }
} // class fakeTPM251

let device = new fakeTPM251({});
let trace = 1,
  ln = "ClassStepTRM251_test::";
if (trace) {
  console.log(ln + `device=`);
  console.dir(device, { depth: 1 });
}
let step1 = new ClassThermoStepTRM251({
  checkTime: 500,
  device: device,
  number: 3,
});
if (trace) {
  console.log(ln + `step1=`);
  console.dir(step1, { depth: 1 });
}

step1.start();
