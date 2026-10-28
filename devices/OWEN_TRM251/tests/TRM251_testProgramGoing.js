/**
 * Прогін зібраної програми TRM-251 на емуляторі.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/TRM251_testProgramGoing.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const createTRM251StepsManager = require("./createTRM251StepsManager.js");
const ClassStep_TRM251_Thermal = require("../ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");

describe("TRM251 програма виконується", () => {
  it("StepsManager.start() проходить усі кроки і переходить на програму 2", async () => {
    const StepsManager = createTRM251StepsManager();
    const tasks = StepsManager.program.tasks;
    for (const step of tasks) {
      step.checkPeriod = 0;
      step.checkTime = 20;
    }
    StepsManager.program.checkTime = 20;

    await StepsManager.start();

    assert.deepEqual(
      tasks.map((step) => step.state._id),
      [
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
        "finished",
      ],
    );
    assert.equal(tasks[0].constructor, ClassStep_TRM251_Thermal);
    assert.equal(tasks[5].constructor, ClassStep_TRM251_nextProgram);
    assert.equal(tasks[5].prgN, 2);
    assert.equal(StepsManager.program.state._id, "finished");
    assert.equal(StepsManager.device.prgN, 2);
    assert.equal(StepsManager.device.step, 5);
    assert.equal(StepsManager.device.mode, 1);
  });
});
