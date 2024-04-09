const ClassStepGeneral = require("./ClassStepGeneral.js");
const log = require("../../tools/log.js");
const dummy = require("../../tools/dummy.js").dummyPromise;

module.exports = class ClassStepParallel extends ClassStepGeneral {
  constructor(props) {
    props.ln = "ClassStepParallel::";
    super(props);
    this.tasks = props.tasks; //Array of async functions
    // current tasks
    this.curTasks = [];
  } //constructor(props)
  async start() {
    let trace = 1,
      ln = this.ln + "start()::";
    super.start();
    // TODO Милиця для очікування завершення deforeStart
    await dummy(3000);
    await Promise.all(this.tasks.map((task) => task.start()));
    if (this.state._id == "going") {
      this.finish();
      trace ? log("i", ln, `All steps finished`) : null;
    }
  } // async start()
  async stopAll() {
    for (let i = 0; i < this.tasks.length; i++) {
      const element = this.tasks[i];
      if (element.state._id == "going") {
        await element.stop();
      }
    }
  }

  async stop() {
    await this.stopAll();
    super.stop();
  } //async stop ()

  async error(message) {
    await this.stopAll();
    super.error(message);
  }

  getState() {
    let res = super.getState();
    res.tasks = [];
    for (let i = 0; i < this.tasks.length; i++) {
      res.tasks.push(this.tasks[i].getState());
    }
    return res;
  }
}; //class ClassSerialSteps
