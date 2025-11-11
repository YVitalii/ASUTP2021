// cd ./devices/trp08
// supervisor --no-restart-on exit --w '.' ./tests/trp08_fakeDriver_test.js
const assert = require("assert");
const { describe, it } = require("node:test");
const clone = require("clone");
const iface = require("../../../rs485/class_RS485_emulator");
const makeFakeDriverTrp08 = require("../trp08_fakeDriver");
const realDriver = require("../makeNewDriverFromOld");
let trace = 1,
  ln = (gLn = `trp08_fakeDriver_test.js::`);
// if (trace) {
//   console.log(gLn + `driver=`);
//   console.dir(driver);
// }
// if (trace) {
//   console.log(ln + `iface=`);
//   console.dir(iface);
// }
// console.log("realDriver.setReg=\n", realDriver.setReg.toString());
const driver = makeFakeDriverTrp08(realDriver, { maxT: 500 });

driver.printRegsDescription();
function getNewDriver() {
  let newDriver = makeFakeDriverTrp08(require("../makeNewDriverFromOld"), {
    maxT: 500,
  });
  return newDriver;
}

let makeParams = (regName = "tT", value = null) => {
  let res = {
    iface,
    devAddr: 55,
    regName,
  };
  if (value != null) {
    res.value = value;
  }
  return res;
};

describe("test fake driver TRP08 ", () => {
  let driver = getNewDriver();
  it("Start from cold furnace", () => {
    assert(driver.furnace.getT(), 20);
    assert(driver.pid.inputRange.max, 500);
    assert(typeof driver.setRegPromise, "function");
  });
});

describe("test working with 'tT'", () => {
  //   let driver = getNewDriver();
  let tT = 500;
  let driver = getNewDriver();
  it("set tT", async () => {
    await driver.setRegPromise(makeParams("tT", 500));
    let t = await driver.getRegPromise({ iface, devAddr: 1, regName: "tT" });
    assert.equal(t.value, tT, "must be tT=" + tT);
    console.log("------driver.pid=");
    console.dir(driver.pid);
    assert.equal(driver.pid.setPoint, 100);
    return 1;
  }); //set tT
});
