// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PID = require("../ClassPIDregulator.js");

function makePid(overrides = {}) {
  return new PID({
    id: "pid1",
    getPV: async () => 0,
    setOutput: async () => {},
    inputRange: { min: 0, max: 1000 },
    kp: 1,
    ki: 1,
    kd: 1,
    ...overrides,
  });
}

describe("PID.setParams", () => {
  it("встановлює kp, ki, kd, setPoint і не чіпає відсутні поля", () => {
    const pid = makePid();
    pid.setParams({ kp: 12, ki: 0.4, kd: 1.5, setPoint: 250 });

    expect(pid.kp).toBe(12);
    expect(pid.ki).toBe(0.4);
    expect(pid.kd).toBe(1.5);
    expect(pid.realSetPoint).toBe(250);
    expect(pid.setPoint).toBe(25);

    pid.setParams({ ki: 0 });
    expect(pid.kp).toBe(12);
    expect(pid.ki).toBe(0);
    expect(pid.kd).toBe(1.5);
    expect(pid.realSetPoint).toBe(250);
  });

  it("обмежує коефіцієнти і приймає службові уставки", () => {
    const pid = makePid();
    const getPV = pid.getPV;

    pid.setParams({
      kp: 500,
      kiError: 5,
      period: 2,
      autoCalculation: false,
      manual: true,
    });

    expect(pid.kp).toBe(100);
    expect(pid.kiError).toBe(5);
    expect(pid.period).toBe(2000);
    expect(pid.autoCalculation).toBe(false);
    expect(pid.manual).toBe(true);

    pid.setParams({ getPV: async () => 99, id: "other" });
    expect(pid.getPV).toBe(getPV);
    expect(pid.id).toBe("pid1");

    pid.setParams();
    pid.setParams({});
    expect(pid.kp).toBe(100);
    expect(pid.manual).toBe(true);
  });
});
