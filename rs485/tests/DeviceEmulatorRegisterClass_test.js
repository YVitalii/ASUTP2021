// cd ./rs485
// supervisor --no-restart-on exit ./tests/DeviceEmulatorRegisterClass_test.js

const GeneralRS485deviceEmulatorClass = require("../GeneralRS485deviceEmulatorClass");

const { describe, it, test } = require("node:test");
const { equal } = require("node:assert");

const dev = new GeneralRS485deviceEmulatorClass({ id: "testDevice" });

let trace = 1,
  gLn = "DeviceEmulatorRegisterClass_test.js::";

// лічильник для перевірки зв'язку з батьком
dev.counter = 0;
let fullReg = {
  addr: 1,
  value: 3,
  getR: function () {
    // console.log("this.parent=");
    // console.dir(this.parent);
    return this._value;
  },
  setR: function (val) {
    this.parent.counter += 1;
    this._value = val;
  },
};

// регістр з налаштуваннями
dev.addReg(fullReg);
let emptyReg = { addr: 2 };

// регістр без налаштувань
dev.addReg(emptyReg);

if (trace) {
  console.log(gLn + `dev=`);
  console.dir(dev, { depth: 2 });
}

describe("testing: DeviceEmulatorRegisterClass.js", () => {
  test("Register with default properties", () => {
    let regAddr = emptyReg.addr,
      reg = dev.getReg(regAddr);
    equal(reg.value, null, "Should be null");
    equal(reg.addr, regAddr, `Should be ${regAddr}`);
    reg.value = 5;
    equal(reg.value, 5, "Should be 5");
  });

  test("Register with settings", () => {
    let regAddr = fullReg.addr,
      reg = dev.getReg(regAddr);
    equal(reg.value, fullReg.value, `Should be ${fullReg.value}`);
    equal(reg.addr, regAddr, `Should be ${regAddr}`);
    reg.value = 5;
    equal(reg.value, 5, "Should be 5");
    equal(dev.counter, 1, "Should be 1");
  });
});


