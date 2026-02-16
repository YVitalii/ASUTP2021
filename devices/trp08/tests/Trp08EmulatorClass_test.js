// cd ./devices/trp08
// supervisor --no-restart-on exit ./tests/Trp08EmulatorClass_test.js

const { describe, test } = require("node:test");
const { equal, ok } = require("assert");

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
  let reg = dev.getReg(0);
  //   console.log("--------> reg=");
  //   console.dir(reg);
  describe("state=17", () => {
    reg.value = 17;
  });
});
