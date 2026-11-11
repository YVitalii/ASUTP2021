/**
 * Тести ClassPIDregulator.
 * Запуск: node --test ./controllers/PID/tests/test_ClassPIDregulator.js
 */
const { describe, it } = require("node:test");
const { equal, ok, throws } = require("node:assert");
const ClassPIDregulator = require("../ClassPIDregulator.js");
const Furnace = require("../../../devices/furnaceModel/furnaceModel.js");

/**
 * @param {object} [extra]
 * @param {number|Function} [extra.pv=20]
 */
function createPid(extra = {}) {
  const { pv: initialPv = 20, ...opts } = extra;
  let pv = initialPv;
  let lastU = null;
  const calls = { getPV: 0, setOutput: 0 };

  const pid = new ClassPIDregulator({
    id: "pid_test",
    getPV: () => {
      calls.getPV += 1;
      return typeof pv === "function" ? pv() : pv;
    },
    setOutput: (u) => {
      calls.setOutput += 1;
      lastU = u;
    },
    kp: 1,
    ki: 0,
    kd: 0,
    period: 1,
    setPoint: 50,
    inputRange: { min: 0, max: 100 },
    outputRange: { min: 0, max: 100 },
    kiError: 100,
    ...opts,
  });

  return {
    pid,
    calls,
    get lastU() {
      return lastU;
    },
    setPv(v) {
      pv = v;
    },
  };
}

/** Один синхронний крок без фонового таймера. */
function step(pid) {
  pid.going = 1;
  const u = pid.calculate();
  pid.stop();
  return u;
}

describe("ClassPIDregulator", () => {
  describe("constructor", () => {
    it("вимагає id, getPV і setOutput", () => {
      throws(
        () => new ClassPIDregulator({ getPV: () => 0, setOutput: () => {} }),
        /id/,
      );
      throws(
        () => new ClassPIDregulator({ id: "x", setOutput: () => {} }),
        /getPV/,
      );
      throws(
        () => new ClassPIDregulator({ id: "x", getPV: () => 0 }),
        /setOutput/,
      );
    });

    it("period у секундах → period мс", () => {
      const { pid } = createPid({ period: 2 });
      equal(pid.periodSec, 2);
      equal(pid.period, 2000);
    });

    it("setPoint обрізається до inputRange", () => {
      const { pid } = createPid({
        inputRange: { min: 0, max: 200 },
        setPoint: 250,
      });
      equal(pid.setPoint, 200);
      pid.setPoint = -10;
      equal(pid.setPoint, 0);
    });
  });

  describe("calculate / start / stop", () => {
    it("stop() скидає going і блокує подальші calculate", () => {
      const ctx = createPid({ pv: 0, setPoint: 50, kiError: 100 });
      ctx.pid.start(50);
      equal(ctx.pid.going, 1);
      ok(ctx.calls.setOutput >= 1);
      ctx.pid.stop();
      equal(ctx.pid.going, 0);
      equal(ctx.pid._timer, null);
      const n = ctx.calls.setOutput;
      ctx.pid.calculate();
      equal(ctx.calls.setOutput, n);
    });

    it("велика помилка → output 100% (force)", () => {
      const ctx = createPid({
        pv: 0,
        setPoint: 100,
        inputRange: { min: 0, max: 200 },
        outputRange: { min: 0, max: 100 },
        kiError: 25,
        kp: 0.1,
      });
      const u = step(ctx.pid);
      equal(ctx.pid.output, 100);
      equal(u, 100);
      equal(ctx.lastU, 100);
    });

    it("P-регулятор: output = kp * error_norm", () => {
      const ctx = createPid({
        pv: 40,
        setPoint: 50,
        kp: 2,
        ki: 0,
        kd: 0,
        kiError: 100,
        inputRange: { min: 0, max: 100 },
        outputRange: { min: 0, max: 100 },
      });
      const u = step(ctx.pid);
      equal(ctx.pid.output, 20);
      equal(u, 20);
      equal(ctx.lastU, 20);
    });

    it("масштабує вихід у outputRange", () => {
      const ctx = createPid({
        pv: 0,
        setPoint: 100,
        kp: 1,
        kiError: 100,
        inputRange: { min: 0, max: 100 },
        outputRange: { min: 10, max: 90 },
      });
      const u = step(ctx.pid);
      equal(ctx.pid.output, 100);
      equal(u, 90);
      equal(ctx.lastU, 90);
    });

    it("поза зоною kiError інтеграл не накопичується", () => {
      const ctx = createPid({
        pv: 0,
        setPoint: 50,
        kp: 0,
        ki: 1,
        kd: 0,
        kiError: 5,
        inputRange: { min: 0, max: 100 },
      });
      step(ctx.pid);
      equal(ctx.pid.errorSum, 0);
    });

    it("getPV викликається один раз за calculate", () => {
      const ctx = createPid({ pv: 20, setPoint: 20, kiError: 100 });
      step(ctx.pid);
      equal(ctx.calls.getPV, 1);
    });
  });

  describe("з моделлю печі", () => {
    it("підігріває піч ближче до setPoint", () => {
      const furnace = new Furnace({
        heatersPow: 85,
        heatersWeight: 11,
        furnaceWeight: 60,
        furnaceMaxT: 400,
        furnaceMaxLoss: 15,
        period: 5,
      });
      let lastT = 20;
      const pid = new ClassPIDregulator({
        id: "pid_furnace",
        getPV: () => {
          lastT = furnace.getT();
          return lastT;
        },
        setOutput: (u) => furnace.heat(u),
        kp: 3,
        ki: 0.08,
        kd: 0.2,
        period: 5,
        setPoint: 80,
        inputRange: { min: 0, max: 200 },
        outputRange: { min: 0, max: 100 },
        kiError: 40,
      });

      pid.going = 1;
      for (let i = 0; i < 80; i++) {
        pid.calculate();
      }
      pid.stop();

      ok(lastT > 40, `T=${lastT.toFixed(1)} має піднятися з ambient`);
      ok(
        Math.abs(lastT - 80) < Math.abs(20 - 80),
        `T=${lastT.toFixed(1)} ближче до SP=80 ніж старт`,
      );
    });
  });
});
