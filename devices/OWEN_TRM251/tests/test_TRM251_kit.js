/**
 * Тести комплекту TRM-251: StepsManager, кроки і зібрана програма.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_TRM251_kit.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Class_StepsManager = require("../../../processes/processManager/Class_StepsManager.js");
const ClassStep_TRM251_Thermal = require("../ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");
const tasksList = require("./program_tasksList.js");
const createTRM251StepsManager = require("./createTRM251StepsManager.js");
const TRM251_emulator = require("./TRM251_emulator.js");

describe("комплект TRM-251", () => {
  const steps = createTRM251StepsManager();
  const tasks = steps.program.tasks;

  it("повертає Class_StepsManager із зареєстрованими кроками TRM-251", () => {
    assert.ok(steps instanceof Class_StepsManager);
    assert.equal(
      steps.stepsList.get(ClassStep_TRM251_Thermal.type),
      ClassStep_TRM251_Thermal,
    );
    assert.equal(
      steps.stepsList.get(ClassStep_TRM251_nextProgram.type),
      ClassStep_TRM251_nextProgram,
    );
  });

  it("збирає програму: термокроки і перехід на програму 2", () => {
    assert.equal(steps.program.header.ua, "Колеса чавунні. Відпуск.");
    assert.equal(tasks.length, 10);
    assert.deepEqual(
      tasks.map((step) => step.constructor.type),
      [
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_nextProgram.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
        ClassStep_TRM251_Thermal.type,
      ],
    );
  });

  it("термокрок зберігає Pr, St і температури після beforeProgramSet", () => {
    assert.deepEqual(tasks[0].goal, { Pr: 1, St: 1, tT: 110, H: 10, Y: 20 });
    assert.deepEqual(tasks[2].goal, { Pr: 1, St: 3, tT: 450, H: 59, Y: 120 });
    assert.equal(tasks[5].prgN, 2);
    assert.deepEqual(tasks[6].goal, { Pr: 2, St: 1, tT: 200, H: 15, Y: 25 });
    assert.deepEqual(tasks[7].goal, { Pr: 2, St: 2, tT: 400, H: 60, Y: 90 });
  });

  it("усі кроки працюють з одним емулятором приладу", () => {
    assert.ok(steps.device instanceof TRM251_emulator);
    for (const step of tasks) {
      assert.equal(step.device, steps.device);
    }
  });

  it("не змінює сирий список завдань", () => {
    assert.equal(tasksList[0].id, "description");
    assert.equal(tasksList[3].H, "00:59");
    assert.equal(tasksList[3].type, "thermalTaskSimple");
  });
});
