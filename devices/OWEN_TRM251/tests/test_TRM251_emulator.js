/**
 * Тести емулятора TRM-251.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_TRM251_emulator.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const TRM251_emulator = require("./TRM251_emulator.js");

describe("TRM251_emulator", () => {
  it("start ставить prN/stN і mode=1", async () => {
    const dev = new TRM251_emulator();
    assert.equal(await dev.start({ prN: 2, stN: 3 }), true);
    assert.equal(dev.prgN, 2);
    assert.equal(dev.step, 3);
    assert.equal(dev.mode, 1);
    assert.deepEqual(await dev.getCurrentState(), {
      Alarm: 0,
      programN: 2,
      step: 3,
      mode: 1,
    });
  });

  it("continueFrom приймає prgN і stepN і не запускає прилад", async () => {
    const dev = new TRM251_emulator();
    assert.equal(await dev.continueFrom({ prgN: 3, stepN: 4 }), true);
    assert.equal(dev.prgN, 3);
    assert.equal(dev.step, 4);
    assert.equal(dev.mode, 0);
  });

  it("кожне 5-те читання збільшує крок, після 5-го кроку mode=0", async () => {
    const dev = new TRM251_emulator();
    await dev.start({ prN: 1, stN: 1 });

    for (let n = 1; n <= 4; n++) {
      const state = await dev.getCurrentState();
      assert.equal(state.step, 1);
      assert.equal(state.mode, 1);
    }
    assert.equal((await dev.getCurrentState()).step, 2);

    await dev.continueFrom({ prN: 1, stN: 5 });
    dev.mode = 1;
    for (let n = 1; n <= 4; n++) {
      assert.equal((await dev.getCurrentState()).step, 5);
    }
    const advanced = await dev.getCurrentState();
    assert.equal(advanced.step, 6);
    assert.equal(advanced.mode, 1);
    const stopped = await dev.getCurrentState();
    assert.equal(stopped.step, 6);
    assert.equal(stopped.mode, 0);

    const stayed = await dev.getCurrentState();
    assert.equal(stayed.step, 6);
    assert.equal(stayed.mode, 0);
  });
});
