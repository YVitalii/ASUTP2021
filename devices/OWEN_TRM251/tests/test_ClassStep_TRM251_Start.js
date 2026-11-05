/**
 * Тести ClassStep_TRM251_Start.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_Start.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_Start = require("../ClassStep_TRM251_Start.js");

function create(props = {}) {
  return new ClassStep_TRM251_Start({
    device: { start: async () => true },
    prN: 2,
    stN: 1,
    ...props,
  });
}

describe("ClassStep_TRM251_Start", () => {
  it("має тип TRM251_Start, regs і заголовок пуску", () => {
    const item = create({ prN: 3, stN: 4 });
    assert.equal(ClassStep_TRM251_Start.type, "TRM251_Start");
    assert.equal(item.state.type, "ProsessStep_SimpleBadge");
    assert.deepEqual(item.regs, { prN: 3, stN: 4 });
    assert.equal(item.header.ua, "Пуск Пр3; Кр4");
    assert.equal(item.header.en, "Start Pr3; St4");
    assert.equal(item.header.ru, "Пуск Пр3; Шг4");
    assert.equal(item.state._id, "waiting");
  });

  it("getStep і createStep повертають новий екземпляр", () => {
    const props = {
      device: { start: async () => true },
      prN: 3,
      stN: 4,
    };
    const made = ClassStep_TRM251_Start.getStep(props);
    const created = ClassStep_TRM251_Start.createStep(props);
    assert.ok(made instanceof ClassStep_TRM251_Start);
    assert.ok(created instanceof ClassStep_TRM251_Start);
    assert.deepEqual(created.regs, { prN: 3, stN: 4 });
  });

  it("start кличе device.start(regs) і залишає крок finished", async () => {
    const calls = [];
    const item = create({
      device: {
        async start(arg) {
          calls.push(arg);
          return true;
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.deepEqual(calls, [{ prN: 2, stN: 1 }]);
    assert.equal(item.state._id, "finished");
    assert.equal(item.err, null);
  });

  it("start залишає крок error, якщо прилад не запустився", async () => {
    const item = create({
      device: {
        async start() {
          const error = new Error("Прилад не запустився, mode=0");
          error.name = "apiError";
          return error;
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /Прилад не запустився, mode=0/);
  });

  it("start залишає крок error, якщо device.start кидає виняток", async () => {
    const item = create({
      device: {
        async start() {
          throw new Error("немає зв'язку");
        },
      },
    });
    item.checkTime = 0;
    await item.start();
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /немає зв'язку/);
  });

  it("beforeStart кличе device.start(regs) і завершує крок", async () => {
    const calls = [];
    const item = create({
      device: {
        async start(arg) {
          calls.push(arg);
          return true;
        },
      },
    });
    item.state._id = "going";
    item.state.startTime = new Date();
    await item.beforeStart();
    assert.deepEqual(calls, [{ prN: 2, stN: 1 }]);
    assert.equal(item.state._id, "finished");
  });

  it("якщо start повернув помилку, крок переходить у error", async () => {
    const item = create({
      device: {
        async start() {
          const error = new Error("Прилад не запустився, mode=0");
          error.name = "apiError";
          return error;
        },
      },
    });
    await assert.rejects(() => item.beforeStart(), /Прилад не запустився/);
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /Сталася помилка! Прилад не запустився/);
  });

  it("кидає помилку, якщо немає device, prN або stN", () => {
    const device = { start: async () => true };
    assert.throws(
      () => new ClassStep_TRM251_Start({ prN: 2, stN: 1 }),
      /потрібні device, prN і stN/,
    );
    assert.throws(
      () => new ClassStep_TRM251_Start({ device, stN: 1 }),
      /потрібні device, prN і stN/,
    );
    assert.throws(
      () => new ClassStep_TRM251_Start({ device, prN: 2 }),
      /потрібні device, prN і stN/,
    );
  });
});
