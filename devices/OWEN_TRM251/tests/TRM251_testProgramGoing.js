/**
 * Прогін зібраної програми TRM-251 на емуляторі.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/TRM251_testProgramGoing.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const createTRM251StepsManager = require("./createTRM251StepsManager.js");
const ClassStep_TRM251_ProgLoadToDev = require("../ClassStep_TRM251_ProgLoadToDev.js");
const ClassStep_TRM251_Start = require("../ClassStep_TRM251_Start.js");
const ClassStep_TRM251_goToPrSt = require("../ClassStep_TRM251_goToPrSt.js");
const ClassStep_TRM251_Stop = require("../ClassStep_TRM251_Stop.js");

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
      Array(14).fill("finished"),
    );
    assert.equal(tasks[0].constructor, ClassStep_TRM251_ProgLoadToDev);
    assert.equal(tasks[1].constructor, ClassStep_TRM251_Start);
    assert.equal(tasks[6].constructor, ClassStep_TRM251_goToPrSt);
    assert.equal(tasks[6].prN, 2);
    assert.equal(tasks[6].stN, 1);
    assert.equal(tasks[11].constructor, ClassStep_TRM251_goToPrSt);
    assert.equal(tasks[11].prN, 3);
    assert.equal(tasks[11].stN, 1);
    assert.equal(tasks.at(-1).constructor, ClassStep_TRM251_Stop);
    assert.equal(StepsManager.program.state._id, "finished");
    assert.match(tasks.at(-1).state.note.ua, /^Завершено /);
    assert.equal(StepsManager.device.prgN, 3);
    assert.equal(StepsManager.device.step, 2);
    assert.equal(StepsManager.device.mode, 0);
  });
});
