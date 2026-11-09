/**
 * Паралельна група зупиняється на помилці або stop будь-якого кроку.
 * Запуск: node --test ./controllers/ClassStep/tests/test_ClassStepsParallel.js
 */
const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");

const dummyMod = require("../../../tools/dummy.js");
const realDummy = dummyMod.dummyPromise;
// Пауза 3000 у start() — милиця перед кроками. У тестах її пропускаємо.
dummyMod.dummyPromise = (period = 1000, ...rest) =>
  period >= 1000 ? Promise.resolve() : realDummy(period, ...rest);
after(() => {
  dummyMod.dummyPromise = realDummy;
});
delete require.cache[require.resolve("../ClassStepGeneral.js")];
delete require.cache[require.resolve("../ClassStepsParallel.js")];

const ClassStep = require("../ClassStepGeneral.js");
const ClassStepsParallel = require("../ClassStepsParallel.js");

function hdr(id) {
  return { ua: id, en: id, ru: id };
}

function step(id, props = {}) {
  const item = new ClassStep({
    id,
    header: hdr(id),
    checkTime: 15,
    async beforeStart() {
      this.started = true;
    },
    ...props,
  });
  item.started = false;
  return item;
}

function endIn(id, end, delay) {
  return step(id, {
    async beforeStart() {
      this.started = true;
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (end == "error") this.error(new Error("збій кроку"));
      if (end == "stop") this.stop();
      if (end == "finish") this.finish();
    },
  });
}

function group(tasks) {
  return new ClassStepsParallel({
    id: "grp",
    header: hdr("Група"),
    checkTime: 15,
    tasks,
  });
}

function states(seq) {
  return seq.tasks.map((task) => task.state._id);
}

class ThrowStep extends ClassStep {
  async start() {
    this.state._id = "going";
    this.state.startTime = new Date();
    throw new Error("зрив");
  }
}

describe("ClassStepsParallel", () => {
  it("помилка зупиняє той крок, що ще йде, і лишає вже завершений", async () => {
    const done = endIn("st_done", "finish", 5);
    const hold = step("st_hold");
    const bad = endIn("st_bad", "error", 30);
    const seq = group([done, hold, bad]);

    await seq.start();

    assert.deepEqual(states(seq), ["finished", "stoped", "error"]);
    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /збій кроку/);
    assert.match(bad.state.note.ua, /збій кроку/);
    assert.match(hold.state.note.ua, /^Зупинено/);
    assert.equal(hold.started, true);
    assert.equal(done.started, true);
    const view = seq.getState();
    assert.deepEqual(
      view.tasks.map((task) => [task.id, task._id]),
      [
        ["st_done", "finished"],
        ["st_hold", "stoped"],
        ["st_bad", "error"],
      ],
    );
  });

  it("stop одного кроку зупиняє інші, група в stoped", async () => {
    const hold = step("st_hold");
    const stopped = endIn("st_stop", "stop", 20);
    const seq = group([hold, stopped]);

    await seq.start();

    assert.deepEqual(states(seq), ["stoped", "stoped"]);
    assert.equal(seq.state._id, "stoped");
    assert.match(seq.state.note.ua, /^Зупинено/);
    assert.equal(hold.started, true);
  });

  it("пізніший stop не перекриває вже поставлену помилку", async () => {
    const bad = endIn("st_bad", "error", 15);
    const late = endIn("st_late", "stop", 80);
    const seq = group([bad, late]);

    await seq.start();

    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /збій кроку/);
    assert.deepEqual(states(seq), ["error", "stoped"]);
  });

  it("виняток start() зупиняє решту і ставить групу в error", async () => {
    const hold = step("st_hold");
    const boom = new ThrowStep({
      id: "st_boom",
      header: hdr("st_boom"),
      checkTime: 15,
    });
    const seq = group([hold, boom]);

    await seq.start();

    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /зрив/);
    assert.equal(hold.state._id, "stoped");
    assert.equal(hold.started, true);
    assert.equal(boom.state._id, "stoped");
  });

  it("stop групи під час виконання зупиняє всі кроки", async () => {
    let seq;
    const a = step("st_a", {
      async beforeStart() {
        this.started = true;
        setTimeout(() => seq.stop(), 20);
      },
    });
    const b = step("st_b");
    seq = group([a, b]);

    await seq.start();

    assert.deepEqual(states(seq), ["stoped", "stoped"]);
    assert.equal(seq.state._id, "stoped");
    assert.match(seq.state.note.ua, /^Зупинено/);
    assert.equal(a.started, true);
    assert.equal(b.started, true);
  });

  it("усі кроки finished залишають групу finished", async () => {
    const a = endIn("st_a", "finish", 5);
    const b = endIn("st_b", "finish", 15);
    const seq = group([a, b]);

    await seq.start();

    assert.deepEqual(states(seq), ["finished", "finished"]);
    assert.equal(seq.state._id, "finished");
    assert.match(seq.state.note.ua, /^Завершено/);
  });
});
