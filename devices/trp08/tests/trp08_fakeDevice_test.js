// cd ./devices/trp08
// supervisor --timestamp --no-restart-on exit ./tests/trp08_fakeDevice_test.js

const assert = require("assert");
const { describe, it } = require("node:test");
const { equal, match, deepStrictEqual } = require("node:assert");
const ClassFakeTRP = require("../trp08_fakeDevice.js");

let params = {
  id: "zone1",
  minT: 0,
  maxT: 1000,
  furnace: {
    heatCapacity: 3000,
    power: 7000,
  },
};

describe("Create new device ", () => {
  it("From empty parameters", () => {
    let dev = new ClassFakeTRP({ id: "z1" });
    let trace = 0,
      ln = "From empty parameters::";
    if (trace) {
      console.log("i", ln, `dev=`);
      console.dir(dev);
    }
    assert.equal(dev.id, "z1", "should be id='z1'");
    let hc = 2000;
    assert.ok(
      hc * 0.85 <= dev.furnace.heatCapacity &&
        dev.furnace.heatCapacity <= hc * 1.15,
      "should be furnace.heatCapacity=2000±15%Дж, but really=" +
        dev.furnace.heatCapacity
    );
    let p = 7000,
      cP = dev.furnace.power;
    assert.ok(
      p * 0.85 <= cP && cP <= p * 1.15,
      "should be furnace.power=7000±15%Дж but really=" + dev.furnace.power
    );
    assert.equal(typeof dev.pid, "object", "Should be an Object");
    assert.equal(
      dev.pid.inputRange.max,
      500,
      "Should be dev.pid.inputRange.max=500"
    );
  });
});

describe("work with registers", () => {
  let dev = new ClassFakeTRP(params);
  let req = { id: 1, FC: 3, addr: 0, data: 1 };
  it("get state", (t, done) => {
    dev.send(req, (err, data) => {
      try {
        equal(err, null, "Error should be null");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
  it("set state=start(17)", (t, done) => {
    req.data = 17;
    req.FC = 6;
    dev.send(req, (err, data) => {
      try {
        deepStrictEqual(data, Buffer.from([0, 23]), "Error should be [0,23]");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
