/**
 * Роздруковує стан зібраної програми TRM-251.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_dirCompiledProgramState.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const createTRM251StepsManager = require("./createTRM251StepsManager.js");

function dirCompiledProgramState() {
  const steps = createTRM251StepsManager();
  const state = steps.program.getState();
  console.dir(state, { depth: null });
  return state;
}

describe("зібрана програма TRM-251", () => {
  it("console.dir стану обробленої програми", () => {
    const state = dirCompiledProgramState();
    assert.equal(state._id, "waiting");
    assert.equal(state.tasks.length, 10);
  });
});
