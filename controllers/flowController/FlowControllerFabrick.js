const { duration } = require("happy-dom/lib/PropertySymbol.js");
const ClassTaskGeneral = require("../tasksController/ClassTaskGeneral");

let example = {
  id: "taskFlowController",
  flow: 50, // %
  duration: 1, //minutes
};

class FlowControllerFabrick extends ClassTaskGeneral {
  constructor(props = {}) {
    props.type = "flowControllerFabrick";

    super(props);

    this.regs.currentFlow = new ClassReg_number({
      id: "flow",
      value: 0, //%
      min: 0, // value.min
      max: 100, // value.max
      step: 1,
      header: { ua: `Потік`, en: `Flow`, ru: `Поток` },
      unit: "%",
      comment: { ua: ``, en: ``, ru: `` },
    });
    this.regs.duration = new ClassReg_number({
      id: "timer",
      value: 0, //%
      min: 0, // value.min
      max: 100, // value.max
      step: 1,
      header: { ua: `Потік`, en: `Flow`, ru: `Поток` },
      unit: "%",
      comment: { ua: ``, en: ``, ru: `` },
    });
  } // constructor
  setFlow(flow) {
    this.regs.flow.value = flow;
  }

  getFlow() {
    return this.regs.flow.value;
  }

  setPeriod(period) {
    this.period = period;
  }

  getPeriod() {
    return this.period;
  }
}
