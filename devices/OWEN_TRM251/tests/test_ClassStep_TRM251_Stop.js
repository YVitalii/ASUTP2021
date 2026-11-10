/**
 * Тести ClassStep_TRM251_Stop.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_Stop.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_Stop = require("../ClassStep_TRM251_Stop.js");

function create(props = {}) {
  return new ClassStep_TRM251_Stop({
    device: {
      getRegisterDirectly: async () => 1,
      stop: async () => true,
    },
    ...props,
  });
}

function going(item) {
  item.state._id = "going";
  item.state.startTime = new Date();
  return item;
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
    const props = { device: { getRegisterDirectly: async () => 1 } };
    const made = ClassStep_TRM251_Stop.getStep(props);
    const created = ClassStep_TRM251_Stop.createStep(props);
    assert.ok(made instanceof ClassStep_TRM251_Stop);
    assert.ok(created instanceof ClassStep_TRM251_Stop);
    assert.equal(created.header.ua, "Стоп");
  });

  it("mode 0 завершує крок", async () => {
    const calls = [];
    const item = going(
      create({
        device: {
          async getRegisterDirectly(name) {
            assert.equal(name, "mode");
            return 0;
          },
          async getCurrentState() {
            throw new Error("кеш");
          },
          async stop(...args) {
            calls.push(args);
            return true;
          },
        },
      }),
    );
    assert.equal(await item.testProcess(), true);
    assert.equal(item.state._id, "finished");
    assert.match(item.state.note.ua, /^Завершено /);
    assert.deepEqual(calls, []);
  });

  it("mode 1 зупиняє прилад і чекає наступний режим", async () => {
    const calls = [];
    const item = going(
      create({
        checkPeriod: 2,
        device: {
          async getRegisterDirectly(name) {
            assert.equal(name, "mode");
            return 1;
          },
          async stop(...args) {
            calls.push(args);
            return true;
          },
        },
      }),
    );
    const planned = [];
    const original = global.setTimeout;
    global.setTimeout = (fn, ms) => {
      planned.push(ms);
      return 1;
    };
    try {
      assert.equal(await item.testProcess(), false);
    } finally {
      global.setTimeout = original;
    }
    assert.equal(item.state._id, "going");
    assert.deepEqual(calls, [[]]);
    assert.deepEqual(planned, [2000]);
  });

  it("mode 3 завершує крок: програму виконано", async () => {
    const modes = [1, 3];
    const calls = [];
    const item = create({
      checkPeriod: 0,
      device: {
        async getRegisterDirectly(name) {
          assert.equal(name, "mode");
          return modes.shift();
        },
        async stop(...args) {
          calls.push(args);
          return true;
        },
      },
    });
    item.checkTime = 20;
    await item.start();
    assert.equal(item.state._id, "finished");
    assert.equal(item.state.note.ua, "Програму завершено");
    assert.equal(item.state.note.en, "Program completed");
    assert.equal(item.state.note.ru, "Программу завершено");
    assert.equal(item.err, null);
    assert.deepEqual(calls, [[]]);
  });

  it("mode 2 переводить крок у error", async () => {
    const item = going(
      create({
        device: {
          getRegisterDirectly: async () => 2,
          stop: async () => true,
        },
      }),
    );
    assert.equal(await item.testProcess(), false);
    assert.equal(item.state._id, "error");
    assert.equal(item.err.ua, "Режим роботи пристрою: Помилка");
    assert.equal(item.err.en, "Device working mode: Error");
    assert.equal(item.err.ru, "Режим работы прибора: Ошибка");
  });

  it("mode 4..7 зупиняє крок і пише номер режиму", async () => {
    for (const mode of [4, 5, 6, 7]) {
      const item = going(
        create({
          device: {
            getRegisterDirectly: async () => mode,
            stop: async () => true,
          },
        }),
      );
      assert.equal(await item.testProcess(), false);
      assert.equal(item.state._id, "stoped");
      assert.equal(item.state.note.ua, `Режим роботи пристрою: mode=${mode}`);
      assert.equal(item.state.note.en, `Device working mode: mode=${mode}`);
      assert.equal(item.state.note.ru, `Режим работы прибора: mode=${mode}`);
    }
  });

  it("timeout не завершує крок і планує наступне опитування", async () => {
    const item = going(
      create({
        checkPeriod: 3,
        device: {
          async getRegisterDirectly() {
            throw new Error("Помилка timeout");
          },
          stop: async () => true,
        },
      }),
    );
    const planned = [];
    const original = global.setTimeout;
    global.setTimeout = (fn, ms) => {
      planned.push(ms);
      return 1;
    };
    try {
      assert.equal(await item.testProcess(), false);
    } finally {
      global.setTimeout = original;
    }
    assert.equal(item.state._id, "going");
    assert.equal(item.state.note.ua, "Немає відповіді приладу, очікування зв'язку");
    assert.deepEqual(planned, [3000]);
  });

  it("помилка читання стану переводить крок у error", async () => {
    const item = going(
      create({
        device: {
          async getRegisterDirectly() {
            throw new Error("немає зв'язку");
          },
          stop: async () => true,
        },
      }),
    );
    assert.equal(await item.testProcess(), false);
    assert.equal(item.state._id, "error");
    assert.match(item.err.ua, /немає зв'язку/);
  });

  it("кидає помилку, якщо немає device", () => {
    assert.throws(() => new ClassStep_TRM251_Stop({}), /потрібен device/);
  });
});
