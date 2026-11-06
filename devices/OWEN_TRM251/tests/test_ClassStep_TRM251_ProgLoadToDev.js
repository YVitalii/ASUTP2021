/**
 * Тести ClassStep_TRM251_ProgLoadToDev.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_ProgLoadToDev.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_ProgLoadToDev = require("../ClassStep_TRM251_ProgLoadToDev.js");
const ClassStep_TRM251_goToPrSt = require("../ClassStep_TRM251_goToPrSt.js");

const program = [
  { fName: "prg05" },
  { tT: 110, H: 10, Y: 20 },
  { type: ClassStep_TRM251_goToPrSt.type, prgN: 2 },
  { tT: 200, H: 15, Y: 25 },
];

function readBack(extra = []) {
  return [
    { id: "program1" },
    { type: "taskThermal_TRM251", tT: 110, H: 10, Y: 20 },
    { type: "taskThermal_TRM251", tT: 200, H: 15, Y: 25 },
    ...extra,
  ];
}

function device(hooks = {}) {
  return {
    regs: { program: { timestamp: 50 } },
    async stop() {
      if (hooks.stop) return hooks.stop();
      return true;
    },
    async setProgram(value) {
      if (hooks.setProgram) return hooks.setProgram(value);
    },
    async getRegister(name) {
      if (hooks.getRegister) return hooks.getRegister(name);
      return readBack();
    },
  };
}

function create(props = {}) {
  const item = new ClassStep_TRM251_ProgLoadToDev({
    device: device(),
    program,
    ...props,
  });
  item.waitMs = 0;
  item.state._id = "going";
  item.state.startTime = new Date();
  return item;
}

describe("ClassStep_TRM251_ProgLoadToDev", () => {
  it("має тип і зберігає прилад та програму", () => {
    const dev = device();
    const item = new ClassStep_TRM251_ProgLoadToDev({ device: dev, program });
    assert.equal(ClassStep_TRM251_ProgLoadToDev.type, "TRM251_ProgLoadToDev");
    assert.equal(item.device, dev);
    assert.equal(item.program, program);
    assert.equal(item.header.ua, "Запис програми");
    assert.equal(item.state.type, "ProsessStep_SimpleBadge");
    assert.equal(item.waitMs, 2000);
    assert.equal(item.state._id, "waiting");
  });

  it("createStep повертає екземпляр кроку", () => {
    const dev = device();
    const item = ClassStep_TRM251_ProgLoadToDev.createStep({
      device: dev,
      program,
    });
    assert.ok(item instanceof ClassStep_TRM251_ProgLoadToDev);
    assert.equal(item.device, dev);
  });

  it("кидає помилку без приладу або програми", () => {
    assert.throws(
      () => new ClassStep_TRM251_ProgLoadToDev({ program }),
      /stop, setProgram і getRegister/,
    );
    assert.throws(
      () =>
        new ClassStep_TRM251_ProgLoadToDev({
          device: device(),
          program: null,
        }),
      /props\.program має бути масивом/,
    );
  });

  it("записує програму, читає її і завершує крок", async () => {
    const calls = [];
    const dev = device({
      stop() {
        calls.push(["stop"]);
        return true;
      },
      setProgram(value) {
        calls.push(["set", value]);
      },
      getRegister(name) {
        calls.push(["get", name, dev.regs.program.timestamp]);
        return readBack([
          { tT: 0, H: 0, Y: 0 },
          { tT: 100, H: 600, Y: 3600 },
        ]);
      },
    });
    const item = create({ device: dev, checkTime: 10 });
    item.state._id = "waiting";
    await item.testProcess();
    assert.deepEqual(calls, [
      ["stop"],
      ["set", program],
      ["get", "program", 0],
    ]);
    assert.equal(item.state._id, "finished");
    assert.match(item.state.note.ua, /^Завершено /);
  });

  it("start лишає примітку про запис програми", async () => {
    const item = new ClassStep_TRM251_ProgLoadToDev({
      device: device(),
      program,
      checkTime: 10,
    });
    item.waitMs = 0;
    await item.start();
    assert.equal(item.state._id, "finished");
    assert.match(item.state.note.ua, /^Завершено /);
  });

  it("після розбіжності повторює запис і завершує крок", async () => {
    let reads = 0;
    const dev = device({
      getRegister() {
        reads += 1;
        if (reads === 1) return readBack().map((step, index) => (index === 1 ? { ...step, tT: 1 } : step));
        return readBack();
      },
    });
    let writes = 0;
    dev.setProgram = async () => {
      writes += 1;
    };
    const item = create({ device: dev });
    await item.testProcess();
    assert.equal(writes, 2);
    assert.equal(reads, 2);
    assert.equal(item.state._id, "finished");
  });

  it("після трьох невдалих перевірок зупиняє крок з помилкою", async () => {
    let writes = 0;
    const dev = device({
      setProgram() {
        writes += 1;
      },
      getRegister() {
        return readBack().map((step, index) => (index === 2 ? { ...step, Y: 0 } : step));
      },
    });
    const item = create({ device: dev });
    assert.equal(await item.testProcess(), false);
    assert.equal(writes, 3);
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /не збігається/);
  });
});
