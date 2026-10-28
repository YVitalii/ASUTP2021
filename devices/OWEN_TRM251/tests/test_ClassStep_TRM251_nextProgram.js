/**
 * Тести ClassStep_TRM251_nextProgram.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_nextProgram.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");

function create(props = {}) {
  return new ClassStep_TRM251_nextProgram({
    prgN: 2,
    goToNextProgram: async () => true,
    ...props,
  });
}

describe("ClassStep_TRM251_nextProgram", () => {
  it("має тип TRM251_nextProgram і зберігає prgN", () => {
    const item = create();
    assert.equal(ClassStep_TRM251_nextProgram.type, "TRM251_nextProgram");
    assert.equal(item.prgN, 2);
    assert.equal(item.header.ua, "Наступна програма 2");
    assert.equal(item.state._id, "waiting");
  });

  it("getStep і createStep повертають новий екземпляр", () => {
    const props = { prgN: 3, goToNextProgram: async () => true };
    const made = ClassStep_TRM251_nextProgram.getStep(props);
    const created = ClassStep_TRM251_nextProgram.createStep(props);
    assert.ok(made instanceof ClassStep_TRM251_nextProgram);
    assert.ok(created instanceof ClassStep_TRM251_nextProgram);
    assert.equal(made.prgN, 3);
    assert.equal(created.prgN, 3);
  });

  it("beforeStart просить перехід на prgN, крок 1 і завершує крок", async () => {
    const calls = [];
    const item = create({
      prgN: 2,
      goToNextProgram: async (arg) => {
        calls.push(arg);
        return true;
      },
    });
    item.state._id = "going";
    item.state.startTime = new Date();
    await item.beforeStart();
    assert.deepEqual(calls, [{ prgN: 2, stepN: 1 }]);
    assert.equal(item.state._id, "finished");
  });

  it("без props.goToNextProgram кличе device.continueFrom", async () => {
    const calls = [];
    const item = new ClassStep_TRM251_nextProgram({
      prgN: 3,
      device: {
        async continueFrom(arg) {
          calls.push(arg);
          return true;
        },
      },
    });
    item.state._id = "going";
    item.state.startTime = new Date();
    await item.beforeStart();
    assert.deepEqual(calls, [{ prN: 3, stN: 1 }]);
    assert.equal(item.state._id, "finished");
  });

  it("після однієї невдачі повторює перехід і завершує крок", async () => {
    let calls = 0;
    const item = create({
      goToNextProgram: async () => {
        calls += 1;
        if (calls === 1) throw new Error("немає зв'язку");
        return true;
      },
    });
    item.state._id = "going";
    item.state.startTime = new Date();
    const started = Date.now();
    await item.beforeStart();
    assert.equal(calls, 2);
    assert.equal(item.state._id, "finished");
    assert.ok(Date.now() - started >= 3000);
  });

  it("після трьох невдалих переходів викидає помилку", async () => {
    let calls = 0;
    const item = create({
      goToNextProgram: async () => {
        calls += 1;
        throw new Error("немає зв'язку");
      },
    });
    const started = Date.now();
    await assert.rejects(() => item.beforeStart(), /немає зв'язку/);
    assert.equal(calls, 3);
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /немає зв'язку/);
    assert.ok(Date.now() - started >= 6000);
  });

  it("кидає помилку, якщо немає ні goToNextProgram, ні continueFrom", () => {
    assert.throws(
      () => new ClassStep_TRM251_nextProgram({ prgN: 2 }),
      /немає props\.goToNextProgram і props\.device\.continueFrom/,
    );
    assert.throws(
      () => new ClassStep_TRM251_nextProgram({ prgN: 2, device: {} }),
      /немає props\.goToNextProgram і props\.device\.continueFrom/,
    );
  });
});
