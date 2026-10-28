const { after, describe, it } = require("node:test");
const { deepEqual, equal, match, rejects } = require("node:assert");
const Manager = require("../ManagerClassTRM251.js");
const driver = require("../driver.js");
const ClassThermalTaskSimple = require("../../../controllers/thermoController/ClassTaskThermal/ClassTaskThermalSimple.js");

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
      { type: "TRM251stepNextProgram", prgN: 2 },
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
    const dev = withMode(device(), 0);
    const res = await dev.setPrSt({ prgN: 2, stepN: 4 });

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
    const badProgram = await dev.setPrSt({ prgN: 4, stepN: 1 });
    const badStep = await dev.setPrSt({ prgN: 1, stepN: 0 });

    equal(badProgram.name, "apiError");
    match(badProgram.msg.ua, /prgN=4 має бути 1\.\.3/);
    equal(badStep.name, "apiError");
    match(badStep.msg.ua, /stepN=0 має бути 1\.\.5/);
    equal(called, false);
  });

  it("повертає APIerror і не пише в прилад, якщо mode не Stop", async () => {
    let called = false;
    driver.setRegPromise = async () => {
      called = true;
    };
    const dev = withMode(device(), 1);
    const res = await dev.setPrSt({ prgN: 1, stepN: 2 });

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
    const res = await dev.setPrSt({ prgN: 1, stepN: 2 });

    equal(res.name, "apiError");
    match(res.msg.ua, /Не вдалося встановити програму 1 крок 2/);
    match(res.msg.ua, /немає відповіді/);
    deepEqual(calls, ["programN", "step"]);
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

  it("у Stop записує програму, крок 1/1 і startStop=1", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      return { value: props.value };
    };
    const dev = running(device(), 0);
    const res = await dev.start({ program: thermalProgram() });

    equal(res, true);
    deepEqual(
      calls.map((call) => call.regName),
      ["program", "programN", "step", "startStop"],
    );
    equal(calls[1].value, 1);
    equal(calls[2].value, 1);
    equal(calls[3].value, 1);
  });

  it("якщо прилад працює, спочатку зупиняє, потім пише програму і стартує", async () => {
    const calls = [];
    let mode = 1;
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      if (props.regName === "startStop" && props.value === 0) mode = 0;
      return { value: props.value };
    };
    const dev = device();
    dev.getRegister = async (regName) =>
      regName === "mode" ? mode : undefined;
    const res = await dev.start({
      program: thermalProgram(),
      prN: 2,
      stN: 3,
    });

    equal(res, true);
    deepEqual(
      calls.map((call) => call.regName),
      ["startStop", "program", "programN", "step", "startStop"],
    );
    equal(calls[0].value, 0);
    equal(calls[2].value, 2);
    equal(calls[3].value, 3);
    equal(calls[4].value, 1);
  });

  it("continueFrom у Stop ставить крок і startStop=1", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push({ regName: props.regName, value: props.value });
      return { value: props.value };
    };
    const dev = running(device(), 0);
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
    dev.getRegister = async () => mode;
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

  it("stop записує startStop=0, коли прилад не зупинений", async () => {
    const calls = [];
    driver.setRegPromise = async (props) => {
      calls.push(props);
      return { value: props.value };
    };
    const dev = running(device(), 2);
    equal(await dev.stop(), true);
    equal(calls.length, 1);
    equal(calls[0].regName, "startStop");
    equal(calls[0].value, 0);
    equal(calls[0].devAddr, 16);
    equal(calls[0].iface, iface);
  });
});
