/**
 * Послідовність зупиняється на помилці або stop будь-якого кроку.
 * Запуск: node --test ./controllers/ClassStep/tests/test_ClassStepsSerial.js
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
delete require.cache[require.resolve("../ClassStepsSerial.js")];

const ClassStep = require("../ClassStepGeneral.js");
const ClassStepsSerial = require("../ClassStepsSerial.js");

function hdr(id) {
  return { ua: id, en: id, ru: id };
}

function makeStep(id, end) {
  const item = new ClassStep({
    id,
    header: hdr(id),
    checkTime: 15,
    async beforeStart() {
      this.started = true;
      if (end == "error") this.error(new Error("збій кроку"));
      if (end == "stop") this.stop();
      if (end == "finish") this.finish();
      if (end == "throw") throw new Error("немає зв'язку");
    },
  });
  item.started = false;
  return item;
}

function program(steps) {
  return new ClassStepsSerial({
    id: "prg",
    header: hdr("Програма"),
    checkTime: 15,
    tasks: steps,
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

describe("ClassStepsSerial", () => {
  it("після помилки кроку наступні лишаються waiting, програма несе текст помилки", async () => {
    const ok = makeStep("st_ok", "finish");
    const bad = makeStep("st_bad", "error");
    const next = makeStep("st_next", "finish");
    const seq = program([ok, bad, next]);

    await seq.start();

    assert.deepEqual(states(seq), ["finished", "error", "waiting"]);
    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /збій кроку/);
    assert.match(bad.state.note.ua, /збій кроку/);
    assert.equal(next.started, false);
    const view = seq.getState();
    assert.deepEqual(
      view.tasks.map((task) => task.id),
      ["st_ok", "st_bad", "st_next"],
    );
    assert.equal(view.tasks[2]._id, "waiting");
  });

  it("після stop кроку програма stoped і наступні не стартують", async () => {
    const ok = makeStep("st_ok", "finish");
    const stopped = makeStep("st_stop", "stop");
    const next = makeStep("st_next", "finish");
    const seq = program([ok, stopped, next]);

    await seq.start();

    assert.deepEqual(states(seq), ["finished", "stoped", "waiting"]);
    assert.equal(seq.state._id, "stoped");
    assert.match(seq.state.note.ua, /^Зупинено/);
    assert.equal(next.started, false);
  });

  it("помилка першого кроку не запускає решту", async () => {
    const bad = makeStep("st_bad", "error");
    const next = makeStep("st_next", "finish");
    const seq = program([bad, next]);

    await seq.start();

    assert.deepEqual(states(seq), ["error", "waiting"]);
    assert.equal(next.started, false);
    assert.match(seq.state.note.ua, /збій кроку/);
  });

  it("виняток beforeStart лишає крок в error і зупиняє послідовність", async () => {
    const bad = makeStep("st_bad", "throw");
    const next = makeStep("st_next", "finish");
    const seq = program([bad, next]);

    await seq.start();

    assert.deepEqual(states(seq), ["error", "waiting"]);
    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /немає зв'язку/);
    assert.equal(next.started, false);
  });

  it("виняток start() зупиняє наступні кроки", async () => {
    const boom = new ThrowStep({
      id: "st_boom",
      header: hdr("st_boom"),
      checkTime: 15,
    });
    const next = makeStep("st_next", "finish");
    const seq = program([boom, next]);

    await seq.start();

    assert.equal(seq.state._id, "error");
    assert.match(seq.state.note.ua, /зрив/);
    assert.equal(boom.state._id, "stoped");
    assert.equal(next.state._id, "waiting");
    assert.equal(next.started, false);
  });

  it("start(from) не чіпає попередні кроки і все одно зупиняється на помилці", async () => {
    const early = makeStep("st_early", "finish");
    const bad = makeStep("st_bad", "error");
    const next = makeStep("st_next", "finish");
    const seq = program([early, bad, next]);

    await seq.start(1);

    assert.deepEqual(states(seq), ["waiting", "error", "waiting"]);
    assert.equal(early.started, false);
    assert.equal(next.started, false);
    assert.equal(seq.state._id, "error");
  });

  it("stop програми під час кроку не запускає наступний", async () => {
    let seq;
    const current = new ClassStep({
      id: "st_now",
      header: hdr("st_now"),
      checkTime: 15,
      async beforeStart() {
        this.started = true;
        setTimeout(() => seq.stop(), 20);
      },
    });
    current.started = false;
    const next = makeStep("st_next", "finish");
    seq = program([current, next]);

    await seq.start();

    assert.deepEqual(states(seq), ["stoped", "waiting"]);
    assert.equal(seq.state._id, "stoped");
    assert.match(seq.state.note.ua, /^Зупинено/);
    assert.equal(current.started, true);
    assert.equal(next.started, false);
  });

  it("усі кроки finished залишають програму finished", async () => {
    const a = makeStep("st_a", "finish");
    const b = makeStep("st_b", "finish");
    const seq = program([a, b]);

    await seq.start();

    assert.deepEqual(states(seq), ["finished", "finished"]);
    assert.equal(seq.state._id, "finished");
    assert.match(seq.state.note.ua, /^Завершено/);
  });
});
