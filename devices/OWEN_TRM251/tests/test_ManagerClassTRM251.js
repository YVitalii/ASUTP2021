const { after, describe, it } = require("node:test");
const { deepEqual, equal, match, rejects } = require("node:assert");
const Manager = require("../ManagerClassTRM251.js");
const driver = require("../driver.js");
const ClassThermalTaskSimple = require("../../../controllers/thermoController/ClassTaskThermal/ClassTaskThermalSimple.js");

const origGetMode = Manager.prototype.getMode;
const origSetRegPromise = driver.setRegPromise;
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
    Manager.prototype.getMode = origGetMode;
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
