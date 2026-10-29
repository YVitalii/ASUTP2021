// cd ./devices/OWEN_TRM251/
// supervisor  --extensions 'js,pug' --timestamp --no-restart-on exit ./tests/driverRegisters_test.js

const { match, equal, throws, notEqual } = require("node:assert");
const { describe, it } = require("node:test");
const driver = require("../driver.js");

describe("Driver's registers test:", () => {
  describe("I1", () => {
    function inputFrame(point, value, status = 0) {
      const buf = Buffer.alloc(8);
      buf.writeUInt16BE(point, 0);
      buf.writeInt32BE(value, 2);
      buf.writeUInt16BE(status, 6);
      return buf;
    }

    it("ділить ціле значення на 10 у степені положення крапки", () => {
      const res = driver.regs.get("I1").get_(inputFrame(1, 236));
      equal(res.err, null);
      equal(res.data.value, 23.6);
    });

    it("читає від'ємну температуру", () => {
      const res = driver.regs.get("I1").get_(inputFrame(1, -214));
      equal(res.err, null);
      equal(res.data.value, -21.4);
    });
  });

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
  }); // describe tT
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
  }); // describe mode

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
        "Message should contain word 'readonly'",
      );
    });
    it("get_()", () => {
      let res = driver.regs.get(regName)._get();

      notEqual(res.err, null, "err != null");
      match(
        res.err.message,
        /readonly/,
        "Message should contain word 'readonly'",
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
  }); // describe startStop
  describe("program:", () => {
    // Крок: уставка int16, положення крапки, H, Y. Час зберігається як є.
    const steps = [
      { rawT: 100, point: 0, H: 5, Y: 5, tT: 100 },
      { rawT: 200, point: 0, H: 10, Y: 10, tT: 200 },
      { rawT: 2500, point: 1, H: 15, Y: 15, tT: 250 },
      { rawT: 300, point: 0, H: 20, Y: 20, tT: 300 },
      { rawT: 350, point: 0, H: 25, Y: 25, tT: 350 },
    ];
    const buf = Buffer.alloc(steps.length * 8);
    steps.forEach((step, i) => {
      const addr = i * 8;
      buf.writeInt16BE(step.rawT, addr);
      buf.writeUInt16BE(step.point, addr + 2);
      buf.writeUInt16BE(step.H, addr + 4);
      buf.writeUInt16BE(step.Y, addr + 6);
    });

    it("_get()", () => {
      let regName = "program";
      let resGet = driver.regs.get(regName)._get();
      equal(resGet.err, null, "err = null");
      equal(resGet.data.addr, 0x0101, "Program address should be 0x0101");
      equal(resGet.data.FC, 3, "Function should be FC3");
      equal(resGet.data.data, 60, "Register count should be 15*4=60");
    }); // it _get

    it("get_()", () => {
      let regName = "program";
      let resGet = driver.regs.get(regName).get_(buf);
      equal(resGet.err, null, "err = null");
      equal(
        resGet.data.value.length,
        steps.length + 1,
        "Length of programm massive should be header + steps",
      );
      equal(resGet.data.value[0].id, "program1");
      for (let i = 0; i < steps.length; i++) {
        const step = resGet.data.value[i + 1];
        equal(step.type, "taskThermal_TRM251", `Step ${i + 1} type`);
        equal(step.tT, steps[i].tT, `Step ${i + 1}. tT`);
        equal(step.H, steps[i].H, `Step ${i + 1}. H`);
        equal(step.Y, steps[i].Y, `Step ${i + 1}. Y`);
      }
    }); // it get_
    it("_set()", () => {
      let regName = "program";
      let prg = [
        { id: "program:1", timeScale: "HH:MM" },
        { tT: 100, H: 5, Y: 5 },
        { tT: 200, H: 10, Y: 10 },
        { tT: 250, H: 15, Y: 15 },
        { tT: 300, H: 20, Y: 20 },
        { tT: 350, H: 25, Y: 25 },
      ];
      let res = driver.regs.get(regName)._set(prg);
      equal(res.err, null);
      equal(res.data.addr, 0x0101);
      equal(res.data.FC, 0x10);
      equal(res.data.data.length, prg.length * 8);
      let out = res.data.data;
      for (let i = 1; i < prg.length; i++) {
        let addr = (i - 1) * 8;
        equal(out.readUInt16BE(addr), prg[i].tT, `Step ${i} tT`);
        equal(out.readUInt16BE(addr + 2), 0, `Step ${i} point`);
        equal(out.readUInt16BE(addr + 4), prg[i].H, `Step ${i} H`);
        equal(out.readUInt16BE(addr + 6), prg[i].Y, `Step ${i} Y`);
      }
      equal(out.readUInt16BE((prg.length - 1) * 8), 0, "Tail step tT");
      equal(out.readUInt16BE((prg.length - 1) * 8 + 4), 0, "Tail step H");
      equal(out.readUInt16BE((prg.length - 1) * 8 + 6), 0, "Tail step Y");
    });
  }); // describe program
  describe("step", () => {
    let regName = "step";
    it("_get()", () => {
      let res = driver.regs.get(regName)._get();
      equal(res.err, null, "err = null");
      equal(res.data.addr, 0x0010, "step address should be 0x0010=" + 0x0010);
      equal(res.data.FC, 3, "Function should be FC3");
      equal(res.data.data, 1, "Bytes quantity should be 1");
    });
    it("get_()", () => {
      let res = driver.regs.get(regName).get_(Buffer.from([0, 3]));
      equal(res.err, null, "err = null");
      equal(res.data.value, 3, "Should value=3");
    });
    it("_set()", () => {
      let res = driver.regs.get(regName)._set(6);
      equal(res.data, null);
      notEqual(res.err, null);
      match(res.err.message, /Invalid/, "Mode should contain 'Invalid'");
      res = driver.regs.get(regName)._set(2);
      equal(res.err, null);
      notEqual(res.data, null);
      equal(res.data.FC, 6, "Function should be FC3");
      equal(res.data.data, 2, "Bytes quantity should be 2");
    }); // it _set
    it("set_()", () => {
      let res = driver.regs.get(regName).set_(Buffer.from([0, 2]));
      equal(res.err, null);
      notEqual(res.data, null);
      equal(res.data.value, 2, "Value should be 2");
    }); // it _set
  }); // describe step
  describe("currentState", () => {
    let regName = "currentState";
    it("_get()", () => {
      let res = driver.regs.get(regName)._get();
      equal(res.err, null, "err = null");
      equal(res.data.addr, 0x000e, "currentState address should be 14");
      equal(res.data.FC, 3, "Function should be FC3");
      equal(res.data.data, 4, "Register count should be 4");
    });
    it("get_()", () => {
      let buf = Buffer.alloc(8);
      buf.writeInt16BE(1, 0);
      buf.writeUInt16BE(3, 2);
      buf.writeUInt16BE(2, 4);
      buf.writeUInt16BE(1, 6);
      let res = driver.regs.get(regName).get_(buf);
      equal(res.err, null, "err = null");
      equal(res.data.value.Alarm, 1);
      equal(res.data.value.programN, 3);
      equal(res.data.value.step, 2);
      equal(res.data.value.mode, 1);
    });
    it("get_() invalid Alarm", () => {
      let buf = Buffer.alloc(8);
      buf.writeInt16BE(2, 0);
      let res = driver.regs.get(regName).get_(buf);
      equal(res.data, null);
      match(res.err.message, /Invalid/, "Alarm should contain 'Invalid'");
    });
    it("_set()", () => {
      let res = driver.regs.get(regName)._set(1);
      equal(res.data, null);
      match(res.err.message, /readonly/, "currentState should be readonly");
    });
  }); // describe currentState
}); // describe driver's registers test
