/**
 * Тести ClassStep_TRM251_goToPrSt.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_goToPrSt.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_goToPrSt = require("../ClassStep_TRM251_goToPrSt.js");

function create(props = {}) {
  return new ClassStep_TRM251_goToPrSt({
    device: { continueFrom: async () => true },
    prN: 2,
    stN: 1,
    ...props,
  });
}

describe("ClassStep_TRM251_goToPrSt", () => {
  it("має тип TRM251_goToPrSt і зберігає prN та stN", () => {
    const item = create();
    assert.equal(ClassStep_TRM251_goToPrSt.type, "TRM251_goToPrSt");
    assert.equal(item.prN, 2);
    assert.equal(item.stN, 1);
    assert.equal(item.header.ua, "Перехід Пр:2 Кр:1");
    assert.equal(item.comment.ua, "Перехід на Пр:2 Кр:1");
    assert.equal(item.state._id, "waiting");
  });

  it("getStep і createStep повертають новий екземпляр", () => {
    const props = {
      device: { continueFrom: async () => true },
      prN: 3,
      stN: 4,
    };
    const made = ClassStep_TRM251_goToPrSt.getStep(props);
    const created = ClassStep_TRM251_goToPrSt.createStep(props);
    assert.ok(made instanceof ClassStep_TRM251_goToPrSt);
    assert.ok(created instanceof ClassStep_TRM251_goToPrSt);
    assert.equal(made.prN, 3);
    assert.equal(created.stN, 4);
  });

  it("beforeStart кличе device.continueFrom і завершує крок", async () => {
    const calls = [];
    const item = create({
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
    assert.deepEqual(calls, [{ prN: 2, stN: 1 }]);
    assert.equal(item.state._id, "finished");
    assert.equal(item.state.note.ua, "Перехід на Пр:2 Кр:1");
  });

  it("після однієї невдачі повторює перехід і завершує крок", async () => {
    let calls = 0;
    const item = create({
      device: {
        async continueFrom() {
          calls += 1;
          if (calls === 1) throw new Error("немає зв'язку");
          return true;
        },
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
      device: {
        async continueFrom() {
          calls += 1;
          throw new Error("немає зв'язку");
        },
      },
    });
    const started = Date.now();
    await assert.rejects(() => item.beforeStart(), /немає зв'язку/);
    assert.equal(calls, 3);
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /немає зв'язку/);
    assert.ok(Date.now() - started >= 6000);
  });

  it("кидає помилку, якщо немає device, prN або stN", () => {
    const device = { continueFrom: async () => true };
    assert.throws(
      () => new ClassStep_TRM251_goToPrSt({ prN: 2, stN: 1 }),
      /потрібні device, prN і stN/,
    );
    assert.throws(
      () => new ClassStep_TRM251_goToPrSt({ device, stN: 1 }),
      /потрібні device, prN і stN/,
    );
    assert.throws(
      () => new ClassStep_TRM251_goToPrSt({ device, prN: 2 }),
      /потрібні device, prN і stN/,
    );
  });
});
