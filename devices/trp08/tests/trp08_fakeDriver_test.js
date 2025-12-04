// cd ./devices/trp08
//

const assert = require("assert");
const { describe, it } = require("node:test");
const clone = require("clone");
const iface = require("../../../rs485/class_RS485_iface_emulator");
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

function getNewDriver(trace = 0) {
  let newDriver = makeFakeDriverTrp08(require("../makeNewDriverFromOld"), {
    maxT: 500,
  });
  let ln = gLn + `getNewDriver();`;
  if (trace) {
    log("i", ln, `newDriver=`);
    console.dir(newDriver, { depth: 1 });
  }
  return newDriver;
}

let makeParams = (regName = "tT", value = null, trace = 0) => {
  let res = {
    iface,
    devAddr: 55,
    regName,
  };
  if (value != null) {
    res.value = value;
  }
  let ln = `makeParams(${regName},${value},${trace})::`;
  if (trace) {
    console.log(ln + `params=`);
    console.dir(res, { depth: 1 });
  }
  return res;
};

describe("test fake driver TRP08 ", () => {
  let driver = getNewDriver();
  it("Start from cold furnace", () => {
    assert(
      driver.furnace.getT(),
      20,
      "Відразу після створення температура в печі має бути 20С"
    );
    assert(driver.pid.inputRange.max, driver.maxT);
    assert(typeof driver.setRegPromise, "function");
  });
});

describe("test working with 'tT'", () => {
  //   let driver = getNewDriver();
  let tT = 500;
  let driver = getNewDriver(0);
  it("set tT", async () => {
    await driver.setRegPromise(makeParams("tT", driver.maxT));
    let reg = await driver.getRegPromise({ iface, devAddr: 1, regName: "tT" });
    assert.equal(reg.value, tT, "must be tT=" + tT);
    // console.log("------driver=");
    // console.dir(driver, { depth: 1 });
    assert.equal(driver.pid.setPoint, 100);
    let tT50 = Math.round(driver.maxT / 2);
    await driver.setRegPromise(makeParams("tT", tT50, 0));
    reg = await driver.getRegPromise({ iface, devAddr: 1, regName: "tT" });
    assert.equal(reg.value, tT50, "must be tT=" + tT50);
    assert.equal(
      driver.pid.setPoint,
      (tT50 * 100) / driver.maxT,
      `For tT=${tT50} and maxT=${driver.maxT} should be PID.setPoint=50% but received ${driver.pid.setPoint}`
    );
    return 1;
  }); //set tT
}); //test working with 'tT' /

describe("test Start/Stop operation", async () => {
  let tT = 500;
  let driver = getNewDriver(0);
  await driver.setRegPromise(makeParams("tT", tT));
  it("Start operation", async () => {
    await driver.setRegPromise(makeParams("state", 17));
    let reg = await driver.getRegPromise(makeParams("state"));
    assert.equal(reg.value, 23, "must be state=23 (Start mode)");
    assert.equal(driver.pid.getState().value, true, `must be state.value=true`);
    return 1;
  }); //Start operation
  it("Stop operation", async () => {
    await driver.setRegPromise(makeParams("state", 1));
    let reg = await driver.getRegPromise(makeParams("state"));
    assert.equal(reg.value, 7, "must be state=7 (Stop mode)");
    assert.equal(
      driver.pid.getState().value,
      false,
      `must be state.value=true`
    );
    return 1;
  }); //Stop operation

  it("Set regMode", async () => {
    let rN = "regMode",
      v = 1;
    let res = await driver.setRegPromise(makeParams(rN, v));
    let reg = await driver.getRegPromise(makeParams(rN));
    assert.equal(reg.value, v, `must be ${rN}=${v}`);
    assert.equal(driver.regMode, "PID", `must be driver.regMode = PID`);

    await assert.rejects(async () => {
      await driver.setRegPromise(makeParams(rN, 2));
    }, /not implemented/);

    assert.match(
      driver.regulator.ln,
      /::pid/,
      `must be driver.regulator.ln = *pid* `
    );
    return 1;
  }); //Set regMode

  it("Set o=10; ti=100; td=150", async () => {
    let regs = { o: 10, ti: 100, td: 150 };
    for (let rN in regs) {
      let v = regs[rN];
      let res = await driver.setRegPromise(makeParams(rN, v));
      let reg = await driver.getRegPromise(makeParams(rN));
      assert.equal(reg.value, v, `must be ${rN}=${v}`);
      let pidKname =
        rN == "o" ? "kp" : rN == "ti" ? "ki" : rN == "td" ? "kd" : "???";
      assert.equal(driver.pid.kp, 10, `must be driver.pid.${pidKname} =${v}`);
    }
    return 1;
  }); //Set o=10; ti=100; td=150

  return 1;
});
