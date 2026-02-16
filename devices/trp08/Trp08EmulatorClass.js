const GeneralRS485deviceEmulatorClass = require("../../rs485/GeneralRS485deviceEmulatorClass.js");

const FurnaceModel = require("../furnaceModel/ClassFurnaceModel.js");

const ClassPIDregulator = require("../../controllers/PID/ClassPIDregulator.js");

class Trp08EmulatorClass extends GeneralRS485deviceEmulatorClass {
  constructor(props = {}) {
    props.id = props.id ? props.id : "trp08emulator";
    super(props);
    // ------------ furnace-model creation ------------
    props.furnace = props.furnace
      ? props.furnace
      : {
          ln: props.id + "_furnace::",
          heatCapacity:
            2000 *
            (1 -
              Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
          power:
            7000 *
            (1 -
              Math.round((Math.random() * (0.15 + 0.15 + 1) - 1) * 100) / 1000),
        };
    this.furnace = new FurnaceModel(props.furnace);
    // ------ PID-regulator creation --------------
    let pid = props.pid ? props.pid : {};
    pid.id = pid.id ? pid.id : this.id + "_pid";
    pid.inputRange =
      pid.inputRange && pid.inputRange.max
        ? pid.inputRange
        : { min: 0, max: 500 };
    pid.getPV = async function () {
      return this.furnace.getTSync();
    };
    pid.setOutput = async function (pow) {
      await this.furnace.setPower(pow);
      return pow;
    };
    this.pid = new ClassPIDregulator(pid);

    this.addReg({
      addr: 256,
      id: "tT",
      value: 0,
    });

    this.addReg({
      addr: 288,
      id: "H",
      value: 0,
    });

    this.addReg({
      addr: 320,
      id: "Y",
      value: 0,
    });

    this.addReg({
      addr: 352,
      id: "o",
      value: 0,
    });

    this.addReg({
      addr: 384,
      id: "ti",
      value: 0,
    });

    this.addReg({
      addr: 416,
      id: "td",
      value: 0,
    });

    // ----------  Register "state" -----------
    this.addReg({
      addr: 0,
      value: 7,
      id: "state",
      note: "Read:7=stoped,23-runing; Write: 17=start; 1=stop",
      setR: function (val) {
        let trace = 1,
          ln = this.parent.ln + `state.set(${val})::`;
        trace ? console.log(ln + `Started`) : null;
        if (val == 17 && this._value != 23) {
          let dad = this.parent,
            pid = dad.pid;
          if (trace) {
            console.log(ln + `dad=`);
            console.dir(dad, { depth: 1 });
          }
          pid.kp = dad.getRegById("o").value;
          pid.kd = dad.getRegById("td").value;
          pid.ki = dad.getRegById("ti").value;
          pid.start(dad.getRegById("tT").value);
          trace ? console.log(ln + `Completed`) : null;
        }
      },
    });
  } // constructor
}

module.exports = Trp08EmulatorClass;
