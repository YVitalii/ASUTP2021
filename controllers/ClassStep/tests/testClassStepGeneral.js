/**
 * Тести ClassStepGeneral.
 * Запуск: node --test ./controllers/ClassStep/tests/testClassStepGeneral.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep = require("../ClassStepGeneral.js");

const header = { ua: "Крок", en: "Step", ru: "Шаг" };
const comment = { ua: "опис", en: "note", ru: "описание" };

function step(props = {}) {
  return new ClassStep({ id: "step-1", header, comment, ...props });
}

function withNow(startMs, nowMs, fn) {
  const realNow = Date.now;
  Date.now = () => nowMs;
  try {
    const item = step();
    item.state.startTime = new Date(startMs);
    return fn(item);
  } finally {
    Date.now = realNow;
  }
}

describe("ClassStepGeneral", () => {
  describe("constructor", () => {
    it("ставить очікування і нульову тривалість", () => {
      const item = step();
      assert.equal(item.state._id, "waiting");
      assert.equal(item.state.duration, "00d00:00:00");
      assert.equal(item.currentDuration, 0);
      assert.equal(item.err, null);
      assert.equal(item.state.startTime, undefined);
      assert.deepEqual(item.state.note, {
        ua: "Очікування",
        en: "Waiting",
        ru: "Ожидание",
      });
      assert.ok(item.state.changed instanceof Date);
    });

    it("бере передані id, header, comment, checkTime і ln", () => {
      const item = step({ checkTime: 50, ln: "test::" });
      assert.equal(item.id, "step-1");
      assert.equal(item.header, header);
      assert.equal(item.comment, comment);
      assert.equal(item.checkTime, 50);
      assert.equal(item.ln, "test::");
    });

    it("без id і header будує запасні значення", () => {
      const item = new ClassStep();
      assert.match(item.id, /^id_\d{6}$/);
      assert.equal(item.header.ua, `Крок ${item.id}`);
      assert.equal(item.checkTime, 2000);
      assert.equal(typeof item.beforeStart, "function");
      assert.equal(typeof item.afterAll, "function");
    });

    it("кидає помилку, якщо beforeStart або afterAll не функції", () => {
      assert.throws(
        () => step({ beforeStart: "no" }),
        /beforeStart must be a function/
      );
      assert.throws(
        () => step({ afterAll: 1 }),
        /afterAll must be a function/
      );
    });
  });

  describe("duration", () => {
    it("до пуску повертає 0 і рядок 00d00:00:00", () => {
      const item = step();
      assert.equal(item.duration(), 0);
      assert.equal(item.state.duration, "00d00:00:00");
      assert.equal(item.currentDuration, 0);
    });

    it("рахує доби, години, хвилини і секунди", () => {
      const start = 1_000_000_000_000;
      const elapsed = 2 * 86400000 + 3 * 3600000 + 4 * 60000 + 5000;
      withNow(start, start + elapsed, (item) => {
        assert.equal(item.duration(), elapsed);
        assert.equal(item.state.duration, "02d03:04:05");
        assert.equal(item.currentDuration, elapsed / 1000);
      });
    });

    it("не обрізає доби до двох цифр", () => {
      const start = 1_000_000_000_000;
      const elapsed = 100 * 86400000;
      withNow(start, start + elapsed, (item) => {
        item.duration();
        assert.equal(item.state.duration, "100d00:00:00");
      });
    });

    it("від'ємний інтервал зводить до нуля", () => {
      withNow(5_000, 1_000, (item) => {
        assert.equal(item.duration(), 0);
        assert.equal(item.state.duration, "00d00:00:00");
      });
    });
  });

  describe("error", () => {
    it("без аргумента ставить стандартний текст і тривалість", () => {
      const item = step();
      item.error();
      assert.equal(item.state._id, "error");
      assert.equal(item.err, item.state.note);
      assert.equal(item.err.ua, "Сталася помилка! Тривалість: 00d00:00:00");
      assert.equal(item.err.en, "An error happened! Duration: 00d00:00:00");
      assert.equal(item.err.ru, "Случилась ошибка! Длительность: 00d00:00:00");
    });

    it("зберігає message об'єкта Error і рядок", () => {
      const fromError = step();
      fromError.error(new Error("немає зв'язку"));
      assert.equal(fromError.err.ua, "Сталася помилка! немає зв'язку");
      assert.equal(fromError.err.en, "An error happened! немає зв'язку");
      assert.equal(fromError.err.ru, "Случилась ошибка! немає зв'язку");

      const fromText = step();
      fromText.error("  timeout  ");
      assert.equal(fromText.err.ua, "Сталася помилка! timeout");
    });

    it("лишає переданий об'єкт із полем ua", () => {
      const item = step();
      const msg = { ua: "Аварія", en: "Alarm", ru: "Авария" };
      item.error(msg);
      assert.equal(item.err, msg);
      assert.equal(item.state.note, msg);
    });
  });

  describe("stop і finish", () => {
    it("ігнорує команду, якщо крок не виконується", () => {
      const item = step();
      item.stop();
      item.finish();
      assert.equal(item.state._id, "waiting");
    });

    it("stop ставить stoped і тривалість у стандартне повідомлення", () => {
      const start = 1_000_000_000_000;
      withNow(start, start + 5000, (item) => {
        item.state._id = "going";
        item.stop();
        assert.equal(item.state._id, "stoped");
        assert.equal(item.state.note.ua, "Крок зупинено! Тривалість: 00d00:00:05");
        assert.equal(item.state.note.en, "Step was stoped! Duration: 00d00:00:05");
        assert.equal(item.state.note.ru, "Шаг остановлен! Длительность: 00d00:00:05");
      });
    });

    it("finish ставить finished і приймає власне повідомлення", () => {
      const item = step();
      item.state._id = "going";
      item.state.startTime = new Date();
      const msg = { ua: "Готово", en: "Done", ru: "Готово" };
      item.finish(msg);
      assert.equal(item.state._id, "finished");
      assert.equal(item.state.note, msg);
    });
  });

  describe("testState і getState", () => {
    it("testState безпечний до пуску і відрізняє завершені стани", () => {
      const item = step();
      assert.equal(item.testState(), 0);
      item.state._id = "going";
      item.state.startTime = new Date();
      assert.equal(item.testState(), 0);
      for (const id of ["finished", "stoped", "error"]) {
        item.state._id = id;
        assert.equal(item.testState(), 1);
      }
    });

    it("getState віддає копію стану з id, header і comment", () => {
      const item = step();
      const state = item.getState();
      assert.equal(state._id, "waiting");
      assert.equal(state.id, "step-1");
      assert.equal(state.header, header);
      assert.equal(state.comment, comment);
      state.note.ua = "змінено";
      assert.equal(item.state.note.ua, "змінено");
    });
  });

  describe("start", () => {
    it("після finish викликає afterAll і завершує проміс", async () => {
      let before = 0;
      let after = 0;
      const item = step({
        checkTime: 10,
        async beforeStart() {
          before += 1;
          item.finish();
        },
        async afterAll() {
          after += 1;
        },
      });

      const result = await item.start();

      assert.equal(result, 1);
      assert.equal(before, 1);
      assert.equal(after, 1);
      assert.equal(item.state._id, "finished");
      assert.ok(item.state.endTime instanceof Date);
      assert.equal(item.err, null);
    });

    it("після stop теж доходить до afterAll", async () => {
      let after = 0;
      const item = step({
        checkTime: 10,
        async beforeStart() {
          item.stop();
        },
        async afterAll() {
          after += 1;
        },
      });

      assert.equal(await item.start(), 1);
      assert.equal(item.state._id, "stoped");
      assert.equal(after, 1);
    });

    it("помилка beforeStart лишає стан error і не кличе afterAll", async () => {
      let after = 0;
      const item = step({
        async beforeStart() {
          throw new Error("немає зв'язку");
        },
        async afterAll() {
          after += 1;
        },
      });

      const result = await item.start();

      assert.equal(result, undefined);
      assert.equal(after, 0);
      assert.equal(item.state._id, "error");
      assert.equal(item.err.ua, "Сталася помилка! немає зв'язку");
    });
  });
});
