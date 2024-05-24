const ClassStepGeneral = require("./ClassStepGeneral.js");
const log = require("../../tools/log");
const dummy = require("../../tools/dummy.js").dummyPromise;

class ClassSerialSteps extends ClassStepGeneral {
  constructor(props) {
    props.ln = (props.ln ? props.ln : "") + "ClassStepsSerial::";
    super(props);
    this.tasks = props.tasks; //Array of async functions
    // current task
    this.curTask = {};
    this.curTask.number = 0;
    this.curTask.item = this.tasks[0];
  } // constructor

  async start(from = 0) {
    let trace = 1,
      ln = this.ln + `start(from=${from})::`;
    super.start();

    // TODO Милиця для очікування завершення deforestart
    await dummy(3000);
    //this.testProcess();
    for (let step = parseInt(from); step < this.tasks.length; step++) {
      // trace ? log('i',ln,`this.state._id=`,this.state._id) : null;
      if (this.state._id != "going") {
        break;
      }
      const element = this.tasks[step];
      if (!element) throw new Error(ln + `Step number ${step} not finded!`);
      trace ? log("i", ln, `Started step.id=`, element.id) : null;
      this.curTask.item = element;
      this.curTask.number = step;
      await element.start();
      trace ? log("i", ln, `Finished step.id=`, element.id) : null;
    }

    if (this.state._id == "going") {
      this.finish();
      trace ? log("i", ln, `All steps finished`) : null;
    }

    // return
  } // async start

  async stop() {
    let trace = 1,
      ln = this.ln + "stop()::";
    if (this.curTask.item.state._id == "going") {
      trace ? log("i", ln, `Stoping::`, this.curTask.item.ln) : null;
      await this.curTask.item.stop();
      trace ? log("i", ln, `Was stoped::`, this.curTask.item.ln) : null;
    }
    super.stop();
  } //async stop ()

  async error(message) {
    console.log("---------- this.curTask.item.state._id=");
    console.dir(this.curTask.item.state._id);
    if (this.curTask.item.state._id == "going") {
      await this.curTask.item.stop();
    }
    super.error(message);
  }

  getState() {
    let trace = 0,
      ln = this.ln + "getState()::";
    let res = super.getState();
    res.tasks = [];
    for (let i = 0; i < this.tasks.length; i++) {
      if (trace) {
        log("i", ln, `this.tasks[${i}]=`);
        console.dir(this.tasks[i]);
      }
      res.tasks.push(this.tasks[i].getState());
    }

    return res;
  }
  //   async testState() {
  //     //this.curTask.state = this.curTask.item.state;
  //     this.super.testState();
  //   }
}

module.exports = ClassSerialSteps;
