const { after, describe, it } = require("node:test");
const { deepEqual, equal, match, rejects } = require("node:assert");
const Manager = require("../ManagerClassTRM251.js");
const driver = require("../driver.js");
const ClassThermalTaskSimple = require("../../../controllers/thermoController/ClassTaskThermal/ClassTaskThermalSimple.js");
const ClassStep_TRM251_goToPrSt = require("../ClassStep_TRM251_goToPrSt.js");

const origSetRegPromise = driver.setRegPromise;
const origGetRegPromise = driver.getRegPromise;
Manager.prototype.getMode = async function () {};

const iface = { id: "fake", isOpened: true, send() {} };

function device() {
  return new Manager({ iface, addr: 16, id: "TRM251-test" });
}

function thermalProgram() {
  return [
    { id: "program1", timeScale: "HH:MM" },
    new ClassThermalTaskSimple({ maxT: 1200, tT: 100, H: 5, Y: 5 }),
    new ClassThermalTaskSimple({ maxT: 1200, tT: 200, H: "00:10", Y: 15 }),
    new ClassThermalTaskSimple({ maxT: 1200, tT: 250, H: 15, Y: "01:15" }),
  ];
}

describe("ManagerClassTRM251 температура", () => {
  after(() => {
    driver.getRegPromise = origGetRegPromise;
  });

  it("округляє температуру з драйвера до 1 знака після коми", async () => {
    driver.getRegPromise = async () => [
      { value: 123.456, detail: { afterGet: { note: "" } } },
    ];
    const dev = device();
    dev.regs.T1.timestamp = 0;
    const value = await dev.getT();
    equal(value, 123.5);
    equal(dev.regs.T1.value, 123.5);
  });

  it("читання з кешу не подовжує актуальність, тож наступне читання йде в прилад", async () => {
    let calls = 0;
    driver.getRegPromise = async () => {
      calls += 1;
      return [{ value: 20 + calls, detail: { afterGet: { note: "" } } }];
    };
    const dev = device();
    dev.regs.T1.timestamp = 0;
    equal(await dev.getT(), 21);
    const readAt = dev.regs.T1.timestamp;
    equal(await dev.getT(), 21);
    equal(calls, 1);
    equal(dev.regs.T1.timestamp, readAt);
    dev.regs.T1.timestamp = Date.now() - dev.regs.T1.obsolescence * 1000 - 1;
    equal(await dev.getT(), 22);
    equal(calls, 2);
  });

  it("лічильник timeout дорівнює 5", () => {
    equal(device().errorCounter.max, 5);
  });

  it("помилка Modbus на tT не крутить лічильник і не ставить offline", async () => {
    let calls = 0;
    const error = new Error("Невідома помилка ModBus");
    error.code = 9;
    error.messages = {
      ua: "Невідома помилка ModBus",
      en: "Undefined ModBus error",
      ru: "Неизвестная ошибка MODBUS.",
    };
    driver.getRegPromise = async () => {
      calls += 1;
      throw error;
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    dev.regs.mode.value = 1;
    dev.regs.tT.timestamp = 0;
    dev.errorCounter.value = 2;
    dev.offLine = true;
    equal(await dev.getRegister("tT"), null);
    equal(dev.regs.tT.value, null);
    equal(calls, 1);
    equal(dev.errorCounter.value, 2);
    equal(dev.offLine, true);
  });

  it("помилка Modbus на T1 ставить null і не кидає виняток", async () => {
    let calls = 0;
    const error = new Error("Невідома помилка ModBus");
    error.code = 9;
    error.messages = {
      ua: "Невідома помилка ModBus",
      en: "Undefined ModBus error",
      ru: "Неизвестная ошибка MODBUS.",
    };
    driver.getRegPromise = async () => {
      calls += 1;
      throw error;
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    dev.regs.T1.timestamp = 0;
    dev.errorCounter.value = 2;
    dev.offLine = true;
    equal(await dev.getRegister("T1"), null);
    equal(dev.regs.T1.value, null);
    equal(calls, 1);
    equal(dev.errorCounter.value, 2);
    equal(dev.offLine, true);
  });

  it("T1 стає null після device offline, а не на першому timeout", async () => {
    const error = new Error("Помилка timeout");
    error.code = 13;
    error.messages = {
      ua: "Помилка timeout",
      en: "Timeout error",
      ru: "Ошибка Timeout.",
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    dev.regs.T1.value = 36;
    dev.regs.T1.timestamp = 0;
    let calls = 0;
    let valueAfterFirstTimeout;
    driver.getRegPromise = async () => {
      calls += 1;
      if (calls === 2) valueAfterFirstTimeout = dev.regs.T1.value;
      throw error;
    };
    equal(await dev.getRegister("T1"), null);
    equal(valueAfterFirstTimeout, 36);
    equal(dev.regs.T1.value, null);
    equal(calls, 5);
    equal(dev.offLine, true);
    equal(dev.errorCounter.value, 5);
  });

  it("offline на іншому регістрі теж гасить T1", async () => {
    const error = new Error("Помилка timeout");
    error.code = 13;
    error.messages = {
      ua: "Помилка timeout",
      en: "Timeout error",
      ru: "Ошибка Timeout.",
    };
    driver.getRegPromise = async () => {
      throw error;
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    dev.regs.T1.value = 36;
    dev.regs.mode.timestamp = 0;
    equal(await dev.getRegister("mode"), null);
    equal(dev.offLine, true);
    equal(dev.regs.T1.value, null);
  });

  it("успішна транзакція з value null скидає offline і лічильник", async () => {
    driver.getRegPromise = async () => [
      { value: null, detail: { afterGet: { note: "" } } },
    ];
    const dev = device();
    dev.offLine = true;
    dev.errorCounter.value = 4;
    dev.regs.mode.timestamp = 0;
    await dev.getRegister("mode");
    equal(dev.offLine, false);
    equal(dev.errorCounter.value, 0);
  });

  it("п'ять timeout підряд ставлять offline", async () => {
    let calls = 0;
    const error = new Error("Помилка timeout");
    error.code = 13;
    error.messages = {
      ua: "Помилка timeout",
      en: "Timeout error",
      ru: "Ошибка Timeout.",
    };
    driver.getRegPromise = async () => {
      calls += 1;
      throw error;
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    dev.regs.mode.timestamp = 0;
    equal(await dev.getRegister("mode"), null);
    equal(calls, 5);
    equal(dev.offLine, true);
    equal(dev.errorCounter.value, 5);
  });
});

describe("ManagerClassTRM251 setProgram", () => {
  after(() => {
    driver.setRegPromise = origSetRegPromise;
  });

  it("записує кроки ClassTaskThermalSimple через driver.program", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props);
      return { value: props.value };
    };
    const program = thermalProgram();
    const dev = device();
    const res = await dev.setProgram(program);

    equal(calls.length, 1);
    equal(calls[0].iface, iface);
    equal(calls[0].devAddr, 16);
    equal(calls[0].regName, "program");
    equal(calls[0].value[0], program[0]);
    deepEqual(calls[0].value.slice(1), [
      { tT: 100, H: 5, Y: 5 },
      { tT: 200, H: 10, Y: 15 },
      { tT: 250, H: 15, Y: 75 },
    ]);
    equal(res.value, calls[0].value);

    const encoded = driver.regs.get("program")._set(calls[0].value);
    equal(encoded.err, null);
    equal(encoded.data.FC, 0x10);
    equal(encoded.data.addr, 0x0101);
    equal(encoded.data.data.readUInt16BE(0), 100);
    equal(encoded.data.data.readUInt16BE(4), 5);
    equal(encoded.data.data.readUInt16BE(8), 200);
    equal(encoded.data.data.readUInt16BE(12), 10);
    equal(encoded.data.data.readUInt16BE(22), 75);
  });

  it("відсікає службовий крок переходу між програмами", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props);
      return { value: props.value };
    };
    const header = { id: "description", fName: "prg02" };
    const dev = device();
    await dev.setProgram([
      header,
      { type: "TRM251stepThermal", tT: 110, H: 10, Y: 20 },
      { type: ClassStep_TRM251_goToPrSt.type, prgN: 2 },
      { type: "TRM251stepThermal", tT: 200, H: 15, Y: 25 },
    ]);

    equal(calls.length, 1);
    equal(calls[0].value[0], header);
    deepEqual(calls[0].value.slice(1), [
      { tT: 110, H: 10, Y: 20 },
      { tT: 200, H: 15, Y: 25 },
    ]);
  });

  it("кидає APIerror, якщо драйвер не записав програму", async () => {
    driver.setRegPromise = async () => {
      throw new Error("немає відповіді");
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    await rejects(
      () => dev.setProgram(thermalProgram()),
      (error) => {
        equal(error.name, "apiError");
        match(error.msg.ua, /Не вдалося записати програму/);
        match(error.msg.ua, /немає відповіді/);
        match(error.message, /Не вдалося записати програму/);
        return true;
      },
    );
  });

  it("кидає APIerror для програми без кроків і не чіпає драйвер", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = device();
    await rejects(
      () => dev.setProgram([{ id: "program1" }]),
      (error) => {
        equal(error.name, "apiError");
        match(error.msg.ua, /заголовок і хоча б один крок/);
        return true;
      },
    );
    equal(called, false);
  });
});

describe("ManagerClassTRM251 setPrSt", () => {
  after(() => {
    driver.setRegPromise = origSetRegPromise;
  });

  function withMode(dev, mode) {
    dev.getRegister = async (name) => {
      if (name === "mode") return mode;
      throw new Error("неочікуваний регістр " + name);
    };
    return dev;
  }

  it("записує programN, потім step, і повертає true", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props);
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return 0;
      if (name === "programN") return 2;
      if (name === "step") return 4;
      throw new Error("неочікуваний регістр " + name);
    };
    const res = await dev.setPrSt({ prN: 2, stN: 4 });

    equal(res, true);
    deepEqual(
      calls.map((call) => ({ regName: call.regName, value: call.value, devAddr: call.devAddr })),
      [
        { regName: "programN", value: 2, devAddr: 16 },
        { regName: "step", value: 4, devAddr: 16 },
      ],
    );
    equal(calls[0].iface, iface);
    equal(calls[1].iface, iface);
  });

  it("повертає APIerror і не пише в прилад, якщо номер поза межами", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = device();
    const badProgram = await dev.setPrSt({ prN: 4, stN: 1 });
    const badStep = await dev.setPrSt({ prN: 1, stN: 0 });

    equal(badProgram.name, "apiError");
    match(badProgram.msg.ua, /prN=4 має бути 1\.\.3/);
    equal(badStep.name, "apiError");
    match(badStep.msg.ua, /stN=0 має бути 1\.\.5/);
    equal(called, false);
  });

  it("повертає APIerror і не пише в прилад, якщо mode не Stop", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = withMode(device(), 1);
    const res = await dev.setPrSt({ prN: 1, stN: 2 });

    equal(res.name, "apiError");
    match(res.msg.ua, /лише коли прилад зупинено \(mode=0\)/);
    match(res.msg.ua, /зараз mode=1/);
    equal(called, false);
  });

  it("повертає APIerror, якщо драйвер не записав крок, і не кидає виняток", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props.regName);
      if (props.regName === "step") throw new Error("немає відповіді");
      return { value: props.value };
    };
    const dev = withMode(device(), 0);
    dev.period.if.timeOut = 0;
    const res = await dev.setPrSt({ prN: 1, stN: 2 });

    equal(res.name, "apiError");
    match(res.msg.ua, /Не вдалося встановити програму 1 крок 2/);
    match(res.msg.ua, /немає відповіді/);
    deepEqual(calls, ["programN", ...Array(dev.errorCounter.max).fill("step")]);
  });

  it("повертає помилку, якщо прилад лишився на іншій програмі або кроці", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props.regName);
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return 0;
      if (name === "programN") return 1;
      if (name === "step") return 1;
      throw new Error("неочікуваний регістр " + name);
    };
    const res = await dev.setPrSt({ prN: 2, stN: 4 });
    equal(res.name, "apiError");
    match(res.msg.ua, /прилад лишився на програмі 1 крок 1/);
    deepEqual(calls, [
      "programN",
      "step",
      "programN",
      "step",
      "programN",
      "step",
    ]);
  });

  it("повторює запис, поки прочитані програма і крок не збігаються", async () => {
    const calls = [];
    let reads = 0;
    driver.setRegPromise = async (props) => {
      calls.push(props.regName);
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return 0;
      if (name === "programN") {
        reads += 1;
        return reads < 2 ? 1 : 2;
      }
      if (name === "step") return reads < 2 ? 1 : 4;
      throw new Error("неочікуваний регістр " + name);
    };
    equal(await dev.setPrSt({ prN: 2, stN: 4 }), true);
    deepEqual(calls, ["programN", "step", "programN", "step"]);
  });
});

describe("ManagerClassTRM251 getCurrentState", () => {
  after(() => {
    driver.getRegPromise = origGetRegPromise;
    driver.setRegPromise = origSetRegPromise;
  });

  it("читає регістр currentState і повертає Alarm, programN, step, mode", async () => {
    const calls = [];
    const state = { Alarm: 0, programN: 2, step: 3, mode: 1 };
    driver.getRegPromise = async (props) => {
      calls.push(props);
      return [{ value: state }];
    };
    const dev = device();
    const res = await dev.getCurrentState();

    const current = calls.filter((call) => call.regName === "currentState");
    deepEqual(res, state);
    equal(current.length, 1);
    equal(current[0].iface, iface);
    equal(current[0].devAddr, 16);
    equal(dev.regs.Alarm.value, 0);
    equal(dev.regs.programN.value, 2);
    equal(dev.regs.step.value, 3);
    equal(dev.regs.mode.value, 1);
    equal(dev.regs.mode.comment.ua, "Робота");
    equal(dev.regs.program.value, null);
  });

  it("кидає APIerror, якщо прилад не віддав стан", async () => {
    driver.getRegPromise = async () => {
      throw new Error("немає відповіді");
    };
    const dev = device();
    dev.period.if.timeOut = 0;
    await rejects(
      () => dev.getCurrentState(),
      (error) => {
        equal(error.name, "apiError");
        match(error.msg.ua, /Не вдалося прочитати поточний стан/);
        match(error.msg.ua, /немає відповіді/);
        return true;
      },
    );
  });
});

describe("ManagerClassTRM251 start/stop", () => {
  after(() => {
    driver.setRegPromise = origSetRegPromise;
  });

  function running(dev, mode) {
    dev.getRegister = async () => mode;
    return dev;
  }

  it("у Stop ставить програму 1 крок 1 і чекає mode=1", async () => {
    const calls = [];
    let mode = 0;
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      if (props.regName === "startStop") mode = 1;
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return mode;
      if (name === "programN") return 1;
      if (name === "step") return 1;
      throw new Error("неочікуваний регістр " + name);
    };
    const res = await dev.start();

    equal(res, true);
    deepEqual(
      calls.map((call) => [call.regName, call.value]),
      [
        ["programN", 1],
        ["step", 1],
        ["startStop", 1],
      ],
    );
  });

  it("повторює startStop, поки mode лишається 0", async () => {
    const calls = [];
    let mode = 0;
    driver.setRegPromise = async (props) => {
      calls.push(props.regName);
      if (props.regName === "startStop" && calls.filter((name) => name === "startStop").length === 2) {
        mode = 1;
      }
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return mode;
      if (name === "programN") return 2;
      if (name === "step") return 3;
      throw new Error("неочікуваний регістр " + name);
    };
    equal(await dev.start({ prN: 2, stN: 3 }), true);
    deepEqual(calls, ["programN", "step", "startStop", "startStop"]);
  });

  it("після 3 спроб повертає помилку з mode, якщо прилад не в роботі", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props.regName);
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return 0;
      if (name === "programN") return 1;
      if (name === "step") return 1;
      throw new Error("неочікуваний регістр " + name);
    };
    const res = await dev.start();

    equal(res.name, "apiError");
    match(res.msg.ua, /mode=0/);
    deepEqual(calls, ["programN", "step", "startStop", "startStop", "startStop"]);
  });

  it("якщо прилад не зупинений, повертає помилку setPrSt і не вмикає startStop", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = running(device(), 1);
    const res = await dev.start({ prN: 2, stN: 3 });

    equal(res.name, "apiError");
    match(res.msg.ua, /лише коли прилад зупинено/);
    equal(called, false);
  });

  it("continueFrom у Stop ставить крок і startStop=1", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return 0;
      if (name === "programN") return 2;
      if (name === "step") return 4;
      throw new Error("неочікуваний регістр " + name);
    };
    equal(await dev.continueFrom({ prN: 2, stN: 4 }), true);
    deepEqual(
      calls.map((call) => [call.regName, call.value]),
      [
        ["programN", 2],
        ["step", 4],
        ["startStop", 1],
      ],
    );
  });

  it("continueFrom спочатку зупиняє прилад, якщо mode не Stop", async () => {
    const calls = [];
    let mode = 1;
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      if (props.regName === "startStop" && props.value === 0) mode = 0;
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async (name) => {
      if (name === "mode") return mode;
      if (name === "programN") return 1;
      if (name === "step") return 1;
      throw new Error("неочікуваний регістр " + name);
    };
    equal(await dev.continueFrom(), true);
    deepEqual(
      calls.map((call) => [call.regName, call.value]),
      [
        ["startStop", 0],
        ["programN", 1],
        ["step", 1],
        ["startStop", 1],
      ],
    );
  });

  it("stop у режимі Stop не чіпає startStop", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = running(device(), 0);
    equal(await dev.stop(), true);
    equal(called, false);
  });

  it("пише startStop=0, поки mode не стане 0", async () => {
    const calls = [];
    let mode = 2;
    driver.setRegPromise = async (props) => {
      calls.push(props);
      if (props.regName === "startStop" && props.value === 0) mode = 0;
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async () => mode;
    equal(await dev.stop(), true);
    equal(calls.length, 1);
    equal(calls[0].regName, "startStop");
    equal(calls[0].value, 0);
    equal(calls[0].devAddr, 16);
    equal(calls[0].iface, iface);
  });

  it("повторює зупинку, поки mode не 0", async () => {
    const calls = [];
    let mode = 1;
    driver.setRegPromise = async (props) => {
      calls.push(props.value);
      if (calls.length === 2) mode = 0;
      return { value: props.value };
    };
    const dev = device();
    dev.timeout = 0;
    dev.getRegister = async () => mode;
    equal(await dev.stop(), true);
    deepEqual(calls, [0, 0]);
  });

  it("після 3 спроб повертає помилку з mode, якщо прилад не зупинився", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props.value);
      return { value: props.value };
    };
    const dev = running(device(), 2);
    dev.timeout = 0;
    const res = await dev.stop();
    equal(res.name, "apiError");
    match(res.msg.ua, /mode=2/);
    deepEqual(calls, [0, 0, 0]);
  });
});
