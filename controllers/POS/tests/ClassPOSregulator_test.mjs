// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const POSregulator = require("../ClassPOSregulator.js");

function makeRegulator(overrides = {}) {
  const state = {
    pv: 0,
    outputs: [],
    ...(overrides.state || {}),
  };
  const params = {
    id: "pos1",
    SP: 100,
    getPV: async () => state.pv,
    setOutput: async (power) => {
      state.outputs.push(power);
    },
    ...overrides,
  };
  delete params.state;
  const reg = new POSregulator(params);
  return { reg, state };
}

describe("POSregulator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("setParams змінює лише передані оперативні уставки", () => {
    const { reg } = makeRegulator({
      SP: 100,
      maxPower: 80,
      dSP: { min: -1, max: 0 },
    });
    const getPV = reg.getPV;

    reg.setParams({ setPoint: 180, maxPower: 150 });
    expect(reg.SP).toBe(180);
    expect(reg.setPoint).toBe(180);
    expect(reg.maxPower).toBe(100);
    expect(reg.dSP).toEqual({ min: -1, max: 0 });

    reg.setParams({ SP: 70, dSP: { max: 2 }, autoCalculate: true, period: 3 });
    expect(reg.setPoint).toBe(70);
    expect(reg.dSP).toEqual({ min: -1, max: 2 });
    expect(reg.autoCalculate).toBe(true);
    expect(reg.period).toBe(3000);
    expect(reg.maxPower).toBe(100);

    reg.setParams({ getPV: async () => 1, id: "other" });
    expect(reg.getPV).toBe(getPV);
    expect(reg.id).toBe("pos1");

    reg.setParams();
    reg.setParams({});
    expect(reg.setPoint).toBe(70);
  });

  it("вимагає id, getPV і setOutput", () => {
    expect(() => new POSregulator({ getPV: async () => 0, setOutput: async () => {} })).toThrow(
      /id/,
    );
    expect(() => new POSregulator({ id: "pos", setOutput: async () => {} })).toThrow(/getPV/);
    expect(() => new POSregulator({ id: "pos", getPV: async () => 0 })).toThrow(/setOutput/);
  });

  it("має уставки за замовчуванням", () => {
    const { reg } = makeRegulator({ SP: undefined });
    expect(reg.SP).toBe(0);
    expect(reg.dSP).toEqual({ min: -1, max: 0 });
    expect(reg.maxPower).toBe(100);
    expect(reg.autoCalculate).toBe(false);
    expect(reg.output).toBe(0);
    expect(reg.going).toBe(0);
    expect(reg.period).toBe(1000);
  });

  it("обмежує maxPower діапазоном 0..100", () => {
    const { reg } = makeRegulator({ maxPower: 140 });
    expect(reg.maxPower).toBe(100);
    reg.maxPower = -20;
    expect(reg.maxPower).toBe(0);
    reg.maxPower = 0;
    expect(reg.maxPower).toBe(0);
    reg.maxPower = 35;
    expect(reg.maxPower).toBe(35);
    expect(() => {
      reg.maxPower = "heat";
    }).toThrow(/maxPower/);
  });

  it("приймає dSP і відхиляє min > max", () => {
    const { reg } = makeRegulator({ dSP: { min: -5, max: 1 } });
    expect(reg.dSP).toEqual({ min: -5, max: 1 });
    reg.dSP = { min: -2 };
    expect(reg.dSP).toEqual({ min: -2, max: 1 });
    expect(() => {
      reg.dSP = { min: 3, max: 1 };
    }).toThrow(/dSP.min/);
  });

  it("вмикає maxPower нижче зони і вимикає вище неї", async () => {
    const { reg, state } = makeRegulator({ maxPower: 80, SP: 200 });

    state.pv = 198;
    expect(await reg.start()).toBe(80);
    expect(state.outputs).toEqual([80]);

    state.pv = 200;
    expect(await reg.calculate()).toBe(0);
    expect(state.outputs.at(-1)).toBe(0);
  });

  it("зберігає позицію всередині гістерезису", async () => {
    const { reg, state } = makeRegulator({ SP: 100, maxPower: 100 });

    state.pv = 20;
    await reg.start();
    expect(reg.output).toBe(100);

    state.pv = 99.5;
    await reg.calculate();
    expect(reg.output).toBe(100);

    state.pv = 100;
    await reg.calculate();
    expect(reg.output).toBe(0);

    state.pv = 99.5;
    await reg.calculate();
    expect(reg.output).toBe(0);

    state.pv = 99;
    await reg.calculate();
    expect(reg.output).toBe(100);

    expect(state.outputs).toEqual([100, 100, 0, 0, 100]);
  });

  it("на межі зони вмикається на нижньому порозі і вимикається на верхньому", async () => {
    const { reg, state } = makeRegulator({ SP: 100, dSP: { min: -1, max: 0 } });

    state.pv = 99;
    await reg.start();
    expect(reg.output).toBe(100);

    state.pv = 100;
    await reg.calculate();
    expect(reg.output).toBe(0);
  });

  it("утримуючи увімкнений стан, підхоплює новий maxPower", async () => {
    const { reg, state } = makeRegulator({ SP: 100 });
    state.pv = 90;
    await reg.start();
    expect(reg.output).toBe(100);

    reg.maxPower = 40;
    state.pv = 99.4;
    await reg.calculate();
    expect(reg.output).toBe(40);
    expect(state.outputs.at(-1)).toBe(40);
  });

  it("start(SP) задає ціль, stop() гасить вихід", async () => {
    const { reg, state } = makeRegulator({ SP: 0 });
    state.pv = 10;
    await reg.start(50);
    expect(reg.SP).toBe(50);
    expect(reg.going).toBe(1);
    expect(reg.output).toBe(100);

    await reg.stop();
    expect(reg.going).toBe(0);
    expect(reg.output).toBe(0);
    expect(state.outputs.at(-1)).toBe(0);

    state.pv = 49.5;
    expect(await reg.calculate()).toBe(0);
    expect(reg.getState().value).toBe(0);
  });

  it("без autoCalculate не планує наступний розрахунок", async () => {
    vi.useFakeTimers();
    const { reg, state } = makeRegulator({ autoCalculate: false, period: 1 });
    state.pv = 10;
    await reg.start();
    state.pv = 200;
    await vi.advanceTimersByTimeAsync(5000);
    expect(state.outputs).toEqual([100]);
    await reg.stop();
  });

  it("з autoCalculate рахує вихід кожен період і зупиняється після stop", async () => {
    vi.useFakeTimers();
    const { reg, state } = makeRegulator({ autoCalculate: true, period: 2, SP: 100 });
    state.pv = 10;
    await reg.start();
    expect(state.outputs).toEqual([100]);

    state.pv = 130;
    await vi.advanceTimersByTimeAsync(2000);
    expect(state.outputs).toEqual([100, 0]);

    await reg.stop();
    state.pv = 10;
    await vi.advanceTimersByTimeAsync(10000);
    expect(state.outputs).toEqual([100, 0, 0]);
    expect(reg.going).toBe(0);
  });
});
