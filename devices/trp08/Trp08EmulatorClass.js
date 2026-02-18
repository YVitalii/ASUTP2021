const GeneralRS485deviceEmulatorClass = require("../../rs485/GeneralRS485deviceEmulatorClass.js");
const {
  fromBCD,
  toBCD,
  fromClock,
  toClock,
} = require("./driver_generalFunctions.js");
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
    pid.entity = this.furnace;
    pid.inputRange =
      pid.inputRange && pid.inputRange.max
        ? pid.inputRange
        : { min: 0, max: 500 };
    pid.getPV = async function () {
      // console.log("device.furnace.getPV():: this=");
      // console.dir(this, { depth: 2 });
      return this.entity.getTSync();
    };
    pid.setOutput = async function (pow) {
      await this.entity.setPower(pow);
      return pow;
    };
    this.pid = new ClassPIDregulator(pid);

    // поточний регулятор бо може бути PID / POS / withTimer
    this.regulator = this.pid;

    // ------------ T --------------------
    this.addReg({
      addr: 1,
      id: "T",
      value: this.furnace.getTSync(),
      note: "current temperature",
      getR: function () {
        this._value = this.parent.furnace.getTSync();
        return toBCD(this._value);
      },
      setR: function (val) {
        throw new TypeError("Read only register");
      },
    });

    // ------ timer --------------------
    this.addReg({
      addr: 2,
      id: "timer",
      value: null,
      note: "current timer",
      getR: function () {
        let val = 0;
        if (this._value != null) {
          val = (new Date().getTime() - val) / 1000 / 60; // час в хвилинах від початку підкроку
        }
        return toClock(val);
      },
      setR: function (val) {
        if (val == null) {
          this._value = null;
          return 0;
        }
        // для запуску таймера потрібно викликати reg.value=0;
        if (val != 0) {
          throw new TypeError("Read only register");
        }
        this._value = new Date().getTime();
      },
    });

    // ------ regMode --------------------
    this.addReg({
      addr: 3,
      id: "regMode",
      value: 1,
      note: "regulator type: 0=off; 1=PID; 2=POS; 3=reversePOS",
      setR: function (val) {
        // для запуску таймера потрібно викликати reg.value=0;
        if (val < 0 || val > 3) {
          throw new RangeError("Value must be 0..3");
        }
        if (val != 1) {
          throw new ReferenceError(
            "At 2026-02-17 work only PID-regulator. POS - should be developed",
          );
        }
        this._value = val;
      },
    });

    // --------------- tT --------------------
    this.addReg({
      addr: 256,
      id: "tT",
      value: 0,
      note: "task temperature",
      setR: function (val) {
        if (val > 0x9999 || val < 0) {
          throw new RangeError("Value must be lower then 0xFFFF");
        }
        let buf = Buffer.alloc(2);
        buf.writeInt16BE(val, 0);

        // console.log("tT::fromBCD::");
        // console.dir(buf);
        // console.dir(fromBCD(buf));
        this._value = fromBCD(buf);
      },
      getR: function () {
        // console.log("tT::toBCD::");
        // console.dir(toBCD(this._value));
        return toBCD(this._value);
      },
    });

    // --------------- H --------------------
    this.addReg({
      addr: 288,
      id: "H",
      value: 0, // всередині зберігаємо в хвилинах, зовні як в регуляторі
      note: "Heating time: External Clock format 0xHHMM",
      setR: function (val) {
        let res = fromClock(val);
        if (res > 99 * 60 + 59) {
          throw new RangeError("Value must be lower then 5999 minutes");
        }
        this._value = res;
      },
      getR: function () {
        return toClock(this._value);
      },
    });

    // --------------- Y --------------------
    this.addReg({
      addr: 320,
      id: "Y",
      value: 0,
      note: "Holding time: External = Clock format 0xHHMM; Internal:minutes",
      setR: function (val) {
        let res = fromClock(val);
        if (res > 99 * 60 + 59) {
          throw new RangeError("Value must be lower then 5999 minutes");
        }
        this._value = res;
      },
      getR: function () {
        return toClock(this._value);
      },
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
        let trace = 0,
          ln = this.parent.ln + `state.set(${val})::`;
        trace ? console.log(ln + `Started`) : null;

        if (!(val == 1 || val == 17)) {
          throw new RangeError(
            `Bad value = ${val}: (should be 1=stop or 17=start)`,
          );
        }

        let dad = this.parent,
          pid = dad.pid;
        // ------------- start --------------
        if (val == 17 && this._value != 23) {
          // if (trace) {
          //   console.log(ln + `dad=`);
          //   console.dir(dad, { depth: 1 });
          // }
          pid.kp = dad.getRegById("o").value;
          pid.kd = dad.getRegById("td").value;
          pid.ki = dad.getRegById("ti").value;
          // pid.SP = dad.getRegById("tT").value;
          pid.start(dad.getRegById("tT")._value);
          // скидаємо таймер
          dad.getRegById("timer").value = 0;
          // встановлюэмо власне значення 23
          this._value = 23;

          trace ? console.log(ln + `Completed`) : null;
          return;
        }
        // ------------ stop ---------
        if (val == 1 && this._value != 7) {
          pid.stop();
          this._value = 7;
          dad.getRegById("timer").value = null;
        }
      },
    });
  } // constructor
}

module.exports = Trp08EmulatorClass;
