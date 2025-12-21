// cd ./devices/OWEN_TRM251/
// supervisor  --extensions 'js,pug' --timestamp --no-restart-on exit ./tests/driverRegisters_test.js

const { match, equal, throws } = require("node:assert");
const { describe, it } = require("node:test");
const driver = require("../driver.js");

describe("Driver's registers test:", () => {
  // ----------------- tT ----------------------
  describe("taskT (tT)", () => {
    let regName = "tT";
    it("_get()", () => {
      let res = driver.regs.get(regName)._get();
      equal(res.err, null, "err = null");
      equal(res.data.addr, 0x000d, "Mode address should be 0x000d=" + 0x000d);
      equal(res.data.FC, 3, "Function should be FC3");
      equal(res.data.data, 1, "Bytes quantity should be 1");
    });
    it("get_()", () => {
      let res = driver.regs.get(regName).get_(Buffer.from([0, 1]));
      equal(res.err, null, "err = null");
      equal(res.data.value, 0.1, "Should value=0.1");
    });
    it("_set(), set_()", () => {
      let res = driver.regs.get(regName)._set(Buffer.from([0, 1]));
      equal(res.data, null);
      match(res.err.message, /readonly/, "Mode should contain 'readonly'");
    });
  });
  // ---------------- mode  ---------------------------
  describe("mode", () => {
    let regName = "mode";
    it("_get()", () => {
      let res = driver.regs.get(regName)._get();
      equal(res.err, null, "err = null");
      equal(res.data.addr, 0x0011, "Mode address should be 0x0011=" + 0x0011);
      equal(res.data.FC, 3, "Function should be FC3");
      equal(res.data.data, 1, "Bytes quantity should be 1");
    });
    it("get_()", () => {
      let res = driver.regs.get(regName).get_(Buffer.from([0, 1]));
      equal(res.err, null, "err = null");
      match(res.data.note, /Working/, "Mode should be 'Working mode'");
      equal(res.data.value, 1, "Should value=1");
    });
    it("_set(), set_()", () => {
      let res = driver.regs.get(regName)._set(Buffer.from([0, 1]));
      equal(res.data, null);
      match(res.err.message, /readonly/, "Mode should contain 'readonly'");
    });
  });
});
