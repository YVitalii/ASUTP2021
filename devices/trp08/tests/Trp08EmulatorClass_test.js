// cd ./devices/trp08
// supervisor --no-restart-on exit ./tests/Trp08EmulatorClass_test.js

const { describe, test } = require("node:test");
const { equal, ok, throws } = require("assert");

const Trp08EmulatorClass = require("../Trp08EmulatorClass");

describe("Trp08Emulator entity creation with empty props", () => {
  let dev = new Trp08EmulatorClass({});
  //   console.dir(dev);
  test("Item created", () => {
    equal(typeof dev, "object", "dev should be an Object");
  });
  test("furnace creation", () => {
    equal(typeof dev.furnace, "object", "dev.furnace should be an Object");
    let f = dev.furnace,
      hCapacity = 2000,
      pow = 7000,
      deviation = 0.15;
    ok(
      hCapacity * (1 - deviation) <= f.heatCapacity &&
        hCapacity * (1 + deviation) >= f.heatCapacity,
      `furnace.heatcapacity shoud be in range ${hCapacity}±15% but f.heatCapacit=${f.heatCapacity}`,
    );
    ok(
      pow * (1 - deviation) <= f.power && pow * (1 + deviation) >= f.power,
      `furnace.power shoud be in range ${pow}±15% but f.power=${f.power} `,
    );
    equal(f.heatingPower, 0, `f.heatingPower should be 0`);
  });

  test("pid creation", () => {
    let pid = dev.pid;
    equal(typeof pid, "object", "dev.pid should be an Object");
    equal(pid.inputRange.min, 0);
    equal(pid.inputRange.max, 500);
    equal(typeof pid.getPV, "function", "dev.pid.getPV should be a Function");
    equal(
      typeof pid.setOutput,
      "function",
      "dev.pid.setOutput should be a Function",
    );
  });
});

describe("test registers", () => {
  let dev = new Trp08EmulatorClass({});

  describe("register T (1)", () => {
    let addr = 0x0001,
      ln = "T::",
      reg = dev.getReg(addr);
    // traceObj(reg);

    test("Reading", () => {
      let t = reg.value;
      equal(reg.value, 0x0020, ln + `Shoud be 0x0020`);
      equal(reg._value, 20, "Should be 20 C");
    });
    test("Writing", () => {
      try {
        reg.value = 5;
      } catch (error) {
        equal(error.message, "Read only register", `Should be an Error`);
      }
    });
  }); //describe("register T (0x0001)"

  describe("register: timer (2)", () => {
    let addr = 0x0002,
      ln = "timer::",
      reg = dev.getReg(addr);
    // traceObj(reg);

    test("Reading", () => {
      let t = reg.value;
      equal(reg.value, 0x0000, ln + `Shoud be 0x0000 because timer stoped`);
    });

    test("Writing", () => {
      throws(
        () => {
          reg.value = 5;
        },
        TypeError,
        "Should be error. timer is read only",
      );
      reg.value = 0;
      equal(typeof reg.value, "number", "When started, shoud be number");

      reg.value = null;
      equal(reg._value, null, "When stoped, shoud be reg._value=null");
    });
  }); //describe("register timer (0x0002)"

  describe("register: regMode (3)", () => {
    let addr = 0x0003,
      ln = "regMode::",
      reg = dev.getReg(addr);
    // traceObj(reg);

    test("Reading", () => {
      equal(
        reg.value,
        0x0001,
        ln + `Shoud be 0x0001 because dafault is PID-regulator`,
      );
    });

    test("Writing", () => {
      throws(
        () => {
          reg.value = 5;
        },
        RangeError,
        "Should be error value in range 0..3",
      );

      throws(
        () => {
          reg.value = 2;
        },
        ReferenceError,
        "Ontime developed only PID-regulator",
      );

      reg.value = 1;
      equal(reg.value, 1, "Shoud be 1");
    });
  }); //describe("register: regMode (0x0003)"

  describe("register: tT (256)", () => {
    let addr = 0x0100, //256
      ln = "tT::",
      reg = dev.getReg(addr);
    // traceObj(reg);
    test("Reading", () => {
      let t = reg.value;
      equal(reg.value, 0, ln + `Shoud be 0 because tT not setted yet`);
    });

    test("Writing", () => {
      throws(
        () => {
          reg.value = 0x9999 + 10;
        },
        RangeError,
        "Error. Should be tT <= 9999 degrees",
      );
      reg.value = 0x0130;
      equal(reg._value, 130, "Shoud be 130 degrees");
      equal(reg.value, 0x0130, "Shoud be 0x0130");
    });
  }); //describe("register timer (0x0002)"

  describe("register: H (288)", () => {
    let addr = 288, //256
      ln = "H::",
      reg = dev.getReg(addr);
    // traceObj(reg);
    test("Reading", () => {
      let t = reg.value;
      equal(reg.value, 0, ln + `Shoud be 0 because H not setted yet`);
    });

    test("Writing", () => {
      throws(
        () => {
          reg.value = 0x9999;
        },
        RangeError,
        "Error. Should be H <= 9959 ",
      );
      reg.value = 0x0130;
      equal(reg._value, 90, "Shoud be 90 minutes");
      equal(reg.value, 0x0130, "Shoud be 0x0130: 01 h 30 minutes");
    });
  }); //describe("register: H (288)"

  describe("register: Y (320)", () => {
    let addr = 320, //256
      ln = "Y::",
      reg = dev.getReg(addr);
    // traceObj(reg);
    test("Reading", () => {
      let t = reg.value;
      equal(reg.value, 0, ln + `Shoud be 0 because Y not setted yet`);
    });

    test("Writing", () => {
      throws(
        () => {
          reg.value = 0x9999;
        },
        RangeError,
        "Error. Should be H <= 9959 ",
      );
      reg.value = 0x0130;
      equal(reg._value, 90, "Shoud be 90 minutes");
      equal(reg.value, 0x0130, "Shoud be 0x0130: 01 h 30 minutes");
    });
  }); //describe("register: H (288)"

  describe("register: o, td, ti ", () => {
    let list = { o: 352, ti: 384, td: 416 },
      val = 80;
    for (const key in list) {
      if (!Object.hasOwn(list, key)) continue;
      let addr = list[key],
        ln = key + "::",
        reg = dev.getReg(addr);
      test(`Reading ${key} (${addr})`, () => {
        equal(
          reg.value,
          0,
          ln +
            `Shoud be 0 because register not setted yet, but ${key}.value=${reg.value}`,
        );
      });

      test(`Writing ${key} (${addr})`, () => {
        reg.value = val;
        equal(reg._value, val, `Shoud be ${key}._value=130`);
        equal(reg.value, val, `Shoud be ${key}.value= 130`);
      });
    }
  }); //describe("register: o, td, ti "

  describe(" register state (0)", () => {
    let addr = 0, //256
      ln = "state::",
      reg = dev.getReg(addr);
    let pid = reg.parent.pid;
    let listPidKeys = { kp: "o", kd: "td", ki: "ti", realSetPoint: "tT" };
    test("Reading", () => {
      equal(reg.value, 7, "Device should be in stop mode yet");
    });
    test("Set Start Mode (send 17)", () => {
      reg.value = 17;

      // testing parameters from listPidKeys
      for (const key in listPidKeys) {
        if (!Object.hasOwn(listPidKeys, key)) continue;
        let r = dev.getRegById(listPidKeys[key]);
        equal(
          pid[key],
          r.value,
          `Should be: pid.${key} (=${pid[key]}) == dev.regs[${listPidKeys[key]}].value (=${r.value}), but `,
        );
      }
      equal(pid.going, true, "the PID regulation must be started");
      equal(reg.value, 23, "the TRP08 must be started");
      equal(
        typeof reg.parent.getRegById("timer").value,
        "number",
        "timer must be started",
      );
    }); //test("Set Start Mode (send 17)"

    test("Set Stop Mode (send 1)", () => {
      reg.value = 1;
      equal(pid.going, false, "the PID regulation must be stoped");
      equal(reg.value, 7, "the TRP08 must be stoped");
      equal(reg.parent.getRegById("timer").value, 0, "timer must be stoped");
    }); //test("Set Stop Mode (send 1)"
  }); //describe(" register state (0)"
});

function traceObj(obj, ln = "", depth = 2) {
  let wrapper = { obj };
  let name = Object.keys(wrapper)[0],
    value = obj;
  console.log(ln + name);
  console.dir(obj, { depth });
}
