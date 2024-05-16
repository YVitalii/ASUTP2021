const ClassEntityGeneral = require("./ClassEntityGeneral");
const ClassTaskThermal = require("../../controllers/thermoController/ClassTaskThermal/ClassTaskThermal.js");
const test = require("../../config.js").test;
const gLn = "ClassEntityFurnace::";
module.exports = class ClassEntityFurnace extends ClassEntityGeneral {
  constructor(props) {
    super(props);
    // ---------  максимальна температура --------------
    if (!props.maxT) {
      throw new Error(this.ln + gLn + " maxT must be specified !!");
    }
    this.maxT = parseInt(parseFloat(props.maxT) * 100) / 100;
    if (isNaN(this.maxT)) {
      throw new Error(
        this.ln + gLn + ` maxT = ${props.maxT} must be a number!!`
      );
    }
    let taskThermal = new ClassTaskThermal({
      maxT: this.maxT,
      firstWave: {
        period: test ? 1 : 12, //період між запитами,сек
        //points:10, //кількість точок вимірювання
        // dT:0.1, // середня похідна за 10 точок
      },
    });
    this.tasksManager.addType(taskThermal);
  }
};
