const chai = require("chai");
const sinon = require("sinon");
const ClassDevManagerGeneral = require("./ClassDevManagerGeneral.js");
const log = require("../../tools/log.js");
const { dummyPromise } = require("../../tools/dummy.js");
const ClassDevManagerRegGeneral = require("./ClassDevManagerRegGeneral.js");
const expect = chai.expect;

describe("ClassDevManagerGeneral", function () {
  let props;

  beforeEach(function () {
    props = {
      id: "trp08",
      iface: { send: sinon.stub(), isOpened: true },
      addr: 1,
      driver: {
        getRegPromise: sinon.stub(),
        setRegPromise: sinon.stub(),
        has: sinon.stub().returns(true),
      },
      regs: {},
    };
  });

  it("should throw an error if addr is not defined", function () {
    props.addr = undefined;
    expect(() => new ClassDevManagerGeneral(props)).to.throw(
      Error,
      `Address of the device must be defined! but: addr="undefined" !`
    );
    props.addr = 1;
  });

  it("should throw an error if driver is not defined or does not have getRegPromise function", function () {
    props.driver = {};
    expect(() => new ClassDevManagerGeneral(props)).to.throw(
      Error,
      `"driver" for the device must be defined and must has the function "getRegPromise"!`
    );
  });

  it("should add a register", function () {
    const manager = new ClassDevManagerGeneral(props);
    const reg = { id: "testReg" };
    manager.addRegister(reg);
    // console.dir(manager.regs["testReg"]);
    // console.log(
    //   "Test:" + manager.regs["testReg"].instanceOf(ClassDevManagerRegGeneral)
    // );
    expect(manager.regs["testReg"]).to.be.instanceOf(ClassDevManagerRegGeneral);
  });

  it("should throw an error if register id is duplicate", function () {
    const manager = new ClassDevManagerGeneral(props);
    const reg = { id: "testReg" };
    manager.addRegister(reg);
    expect(() => manager.addRegister(reg)).to.throw(
      Error,
      `Dublicate reg.id="testReg"! This id already was defined!`
    );
  });

  it("should parse register list from string", function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.regs = { reg1: {}, reg2: {} };
    const regsList = manager.parseRegsList("reg1;reg2");
    expect(regsList).to.deep.equal(["reg1", "reg2"]);
  });

  it("should get register values", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.regs = {
      reg1: { value: 10, isActual: () => true },
      reg2: { value: 20, isActual: () => true },
    };
    const values = manager.getRegsValues();
    expect(values).to.deep.equal({ reg1: 10, reg2: 20, offLine: false });
  });

  it("should set register value", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.regs = { reg1: { value: 10, isActual: () => true } };
    props.driver.setRegPromise.resolves({ value: 30 });
    const result = await manager.setRegister("reg1", 30);
    expect(result).to.equal("reg1=30; ");
    expect(manager.regs["reg1"].value).to.equal(30);
  });

  it("should get register value", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.regs = { reg1: { value: 10, isActual: () => false } };
    props.driver.getRegPromise.resolves([{ value: 30 }]);
    const value = await manager.getRegister("reg1");
    expect(value).to.equal(30);
    expect(manager.regs["reg1"].value).to.equal(30);
  });

  it("should wait for port to open", async function () {
    const manager = new ClassDevManagerGeneral(props);
    props.iface.isOpened = false;
    const promise = manager.testPortOpened();
    props.iface.isOpened = true;
    await promise;
    expect(props.iface.isOpened).to.be.true;
  });

  it("should iterate and handle errors", async function () {
    const manager = new ClassDevManagerGeneral(props);
    const funcItem = sinon.stub().rejects(new Error("Test Error"));
    const params = { regName: "reg1" };
    const promise = manager.iteration(funcItem, params);
    await dummyPromise(1000);
    funcItem.resolves({ value: 30 });
    const result = await promise;
    expect(result).to.deep.equal({ value: 30 });
  }).timeout(6000);

  // New tests
  it("should start the device", async function () {
    const manager = new ClassDevManagerGeneral(props);
    await manager.start();
  });

  it("should stop the device", async function () {
    const manager = new ClassDevManagerGeneral(props);
    await manager.stop();
  });

  it("should return compact HTML", function () {
    const manager = new ClassDevManagerGeneral(props);
    const html = manager.getCompactHtml();
    expect(html).to.be.a("string");
    expect(html).to.include("Not defined yet");
  });

  it("should return full HTML", function () {
    const manager = new ClassDevManagerGeneral(props);
    const html = manager.getFullHtml();
    expect(html).to.be.a("string");
    expect(html).to.include("Not defined yet");
  });

  it("should handle offline state correctly", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.offLine = true;
    const values = manager.getRegsValues();
    expect(values.offLine).to.be.true;
  });

  it("should reset error counter and offline state after successful iteration", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.errorCounter.value = 5;
    manager.offLine = true;
    const funcItem = sinon.stub().resolves({ value: 30 });
    const params = { regName: "reg1" };
    await manager.iteration(funcItem, params);
    expect(manager.errorCounter.value).to.equal(0);
    expect(manager.offLine).to.be.false;
  });

  // Additional tests
  it("should throw an error if iface is not defined or does not have send function", function () {
    props.iface = {};
    expect(() => new ClassDevManagerGeneral(props)).to.throw(
      Error,
      `"iface" for the device must be defined and must has the function "send"!`
    );
  });

  it("should correctly initialize periods based on test flag", function () {
    const manager = new ClassDevManagerGeneral(props);
    let test = true;
    if (test) {
      expect(manager.period.if.portNotOpened).to.equal(1);
      expect(manager.period.if.timeOut).to.equal(2);
      expect(manager.period.if.error).to.equal(1);
      expect(manager.period.if.deviceBusy).to.equal(1);
    } else {
      expect(manager.period.if.portNotOpened).to.equal(5);
      expect(manager.period.if.timeOut).to.equal(5);
      expect(manager.period.if.error).to.equal(10);
      expect(manager.period.if.deviceBusy).to.equal(2);
    }
  });

  it("should correctly initialize error counter based on test flag", function () {
    const manager = new ClassDevManagerGeneral(props);
    let test = true;
    if (test) {
      expect(manager.errorCounter.max).to.equal(3);
    } else {
      expect(manager.errorCounter.max).to.equal(10);
    }
  });

  it("should correctly add multiple registers", function () {
    const manager = new ClassDevManagerGeneral(props);
    const regs = [{ id: "reg1" }, { id: "reg2" }];
    manager.addRegister(regs);
    expect(manager.regs["reg1"]).to.be.instanceOf(ClassDevManagerRegGeneral);
    expect(manager.regs["reg2"]).to.be.instanceOf(ClassDevManagerRegGeneral);
  });

  it("should throw an error if register id is not defined in driver", function () {
    const manager = new ClassDevManagerGeneral(props);
    props.driver.has.returns(false);
    const reg = { id: "testReg" };
    expect(() => manager.addRegister(reg)).to.throw(
      Error,
      `reg.id="testReg" not defined in the device driver`
    );
  });

  it("should correctly parse register list from array", function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.regs = { reg1: {}, reg2: {} };
    const regsList = manager.parseRegsList(["reg1", "reg2"]);
    expect(regsList).to.deep.equal(["reg1", "reg2"]);
  });

  it("should throw an error if regsList is not a string or array", function () {
    const manager = new ClassDevManagerGeneral(props);
    expect(() => manager.parseRegsList(123)).to.throw(
      Error,
      `Uncompatible argument regsList=123`
    );
  });

  it("should correctly handle non-actual register values", async function () {
    props.addr = 1;
    const manager = new ClassDevManagerGeneral(props);

    manager.regs = { reg1: { value: 10, isActual: () => false } };
    props.driver.getRegPromise.resolves([{ value: 30 }]);
    const values = manager.getRegsValues(["reg1"]);
    expect(values).to.deep.equal({ reg1: 10, offLine: false });
  });

  it("should correctly handle device busy state during iteration", async function () {
    const manager = new ClassDevManagerGeneral(props);
    manager.busy = true;
    const funcItem = sinon.stub().resolves({ value: 30 });
    const params = { regName: "reg1" };
    const promise = manager.iteration(funcItem, params);
    await dummyPromise(1000);
    manager.busy = false;
    const result = await promise;
    expect(result).to.deep.equal({ value: 30 });
  });

  it("should correctly handle multiple errors during iteration", async function () {
    const manager = new ClassDevManagerGeneral(props);
    const funcItem = sinon.stub().rejects(new Error("Test Error"));
    const params = { regName: "reg1" };
    manager.testPortOpened = sinon.stub().resolves(true);
    const promise = manager.iteration(funcItem, params);
    await dummyPromise(1000);
    funcItem.onCall(3).resolves({ value: 30 });
    const result = await promise;
    expect(result).to.deep.equal({ value: 30 });
  }).timeout(10000);

  it("should correctly handle offline state during iteration", async function () {
    const manager = new ClassDevManagerGeneral(props);
    // console.dir(manager);
    manager.offLine = true;
    manager.testPortOpened = sinon.stub().resolves(true);
    const funcItem = sinon.stub().resolves({ value: 30 });
    const params = { regName: "reg1" };

    const result = await manager.iteration(funcItem, params);
    expect(result).to.deep.equal({ value: 30 });
    expect(manager.offLine).to.be.false;
  }).timeout(10000);
});
