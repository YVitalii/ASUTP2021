// cd ./devices/OWEN_TRM251/
// supervisor  --extensions 'js,pug' --timestamp --no-restart-on exit ./tests/driverRegisters_test.js

const { match, equal, throws, notEqual } = require("node:assert");
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

  // ----------------startStop ---------------------------
  describe("startStop", () => {
    let regName = "startStop";
    let reg = driver.regs.get(regName);
    it("_get()", () => {
      let res = driver.regs.get(regName)._get();
      // console.dir(res, { depth: 2 });
      notEqual(res.err, null, "err != null");
      match(
        res.err.message,
        /readonly/,
        "Message should contain word 'readonly'"
      );
    });
    it("get_()", () => {
      let res = driver.regs.get(regName)._get();

      notEqual(res.err, null, "err != null");
      match(
        res.err.message,
        /readonly/,
        "Message should contain word 'readonly'"
      );
    });
    it("_set()", () => {
      let res = driver.regs.get(regName)._set(15);
      equal(res.data, null);
      match(res.err.message, /Invalid/, "Mode should contain 'Invalid'");

      res = driver.regs.get(regName)._set(1);

      equal(res.err, null);
      equal(res.data.data, 0xff00, "Should be res.data.data=0xFF00");
      equal(res.data.FC, 5, "Function should be 5");

      res = driver.regs.get(regName)._set(0);
      equal(res.err, null);
      equal(res.data.data, 0, "Should be res.data.data=0");

      res = reg.set_(Buffer.from([0xff, 0]));
      // traceLog("set  1. res=", res);
      equal(res.err, null);
      equal(res.data.value, 1, "Should be res.data.value=1");
      res = reg.set_(Buffer.from([0, 0]));
      // traceLog("set  0. res=", res);
      equal(res.err, null);
      equal(res.data.value, 0, "Should be res.data.value=0");
    });
  });
});

describe("program:", () => {
  // ---------------- example of  program getted from rs485 ---------------------------
  // prettier-ignore
  let res = Buffer.from([
    0x00, 0x00, // масштаб часу 0 - HH:MM
    // -------- крок 1 --------
    0x00, 0x64, // SP1 = 100 -уставка
    0x00, 0x00, // p = 0 - положення десяткової точки SP1=SP1/(p==0? 1:p*10)  
    0x00, 0xB4, // H = 600 - час нагрівання, сек
    0x00, 0xB4, // Y = 306 - час витримки, сек
    // -------- крок 2 --------
    0x00, 0xc8, // SP1 = 200-уставка
    0x00, 0x00, // p = 0 
    0x01, 0x3c, // H = 180
    0x01, 0x3c, // Y = 180
    // -------- крок 3 --------
    0x00, 0xfa, // SP1 = 250-уставка
    0x00, 0x00, // p = 0 
    0x00, 0xf0, // H = 240 - час нагрівання, сек
    0x00, 0xf0, // Y = 240
    // -------- крок 4 --------
    0x01, 0x2c, // SP1 = 300-уставка
    0x00, 0x00, //  p = 0 
    0x01, 0x2c, // H = 300 - час нагрівання, сек
    0x01, 0x2c, // Y = 300
    // -------- крок 5 --------
    0x01, 0x5e, // SP1 = 350-уставка
    0x00, 0x00, //  p = 0 
    0x01, 0x3c, // H = 300
    0x01, 0x3c, // Y = 300
  ]);
  it("_get()", () => {
    let regName = "program";
    let resGet = driver.regs.get(regName)._get();
    equal(resGet.err, null, "err = null");
    equal(
      resGet.data.addr,
      0x0100,
      "Program address should be 0x0100=" + 0x0100
    );
    equal(resGet.data.FC, 3, "Function should be FC3");
    equal(resGet.data.data, 21, "Bytes quantity should be 20");
  }); // it _get

  it("get_()", () => {
    let regName = "program";
    let resGet = driver.regs.get(regName).get_(res);
    // traceLog("get_()::resGet.data.value=", resGet.data.value);
    equal(resGet.err, null, "err = null");
    equal(
      resGet.data.value.length,
      6,
      "Length of programm massive should be 1+5=6 items in program"
    );
    for (let i = 0; i < resGet.data.value.length - 1; i++) {
      const step = resGet.data.value[i + 1];
      let addr = 2 + i * 8;
      let point = res.slice(addr + 2, addr + 4).readUInt16BE();
      let tT =
        res.slice(addr + 0, addr + 2).readUInt16BE() /
        (point == 0 ? 1 : point * 10);
      let H = parseInt(res.slice(addr + 4, addr + 6).readUInt16BE() / 60);
      let Y = parseInt(res.slice(addr + 6, addr + 8).readUInt16BE() / 60);
      // traceLog(` Step ${i + 1}:`, { tT, H, Y });
      equal(step.tT, tT, `Step ${i + 1}. step.tT=${step.tT}; tT=${tT}`);
      equal(step.H, H, `Step ${i + 1}. step.H=${step.H}; H=${H}`);
      equal(step.Y, Y, `Step ${i + 1}. step.Y=${step.Y}; Y=${Y}`);
    }
  }); // it get_
});

function traceLog(msg = "traceLog::", item, depth = 2) {
  console.log(msg);
  console.dir(item, { depth });
}
