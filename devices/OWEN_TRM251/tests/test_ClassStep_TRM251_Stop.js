/**
 * Тести ClassStep_TRM251_Stop.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_Stop.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_Stop = require("../ClassStep_TRM251_Stop.js");

function create(props = {}) {
  return new ClassStep_TRM251_Stop({
    device: { stop: async () => true },
    ...props,
  });
}

describe("ClassStep_TRM251_Stop", () => {
  it("має тип TRM251_Stop і заголовок Стоп", () => {
    const item = create();
    assert.equal(ClassStep_TRM251_Stop.type, "TRM251_Stop");
    assert.equal(item.state.type, "ProsessStep_SimpleBadge");
    assert.equal(item.header.ua, "Стоп");
    assert.equal(item.header.en, "Stop");
    assert.equal(item.header.ru, "Стоп");
    assert.equal(item.state._id, "waiting");
  });

  it("getStep і createStep повертають новий екземпляр", () => {
    const props = { device: { stop: async () => true } };
    const made = ClassStep_TRM251_Stop.getStep(props);
    const created = ClassStep_TRM251_Stop.createStep(props);
    assert.ok(made instanceof ClassStep_TRM251_Stop);
    assert.ok(created instanceof ClassStep_TRM251_Stop);
    assert.equal(created.header.ua, "Стоп");
  });

  it("start кличе device.stop() без аргументів і залишає крок finished", async () => {
    const calls = [];
    const item = create({
      device: {
        async stop(...args) {
          calls.push(args);
          return true;
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.deepEqual(calls, [[]]);
    assert.equal(item.state._id, "finished");
    assert.equal(item.err, null);
  });

  it("start залишає крок error, якщо прилад не зупинився", async () => {
    const item = create({
      device: {
        async stop() {
          const error = new Error("Прилад не зупинився, mode=2");
          error.name = "apiError";
          return error;
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /Прилад не зупинився, mode=2/);
  });

  it("start залишає крок error, якщо device.stop кидає виняток", async () => {
    const item = create({
      device: {
        async stop() {
          throw new Error("немає зв'язку");
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /немає зв'язку/);
  });

  it("кидає помилку, якщо немає device", () => {
    assert.throws(() => new ClassStep_TRM251_Stop({}), /потрібен device/);
  });
});
