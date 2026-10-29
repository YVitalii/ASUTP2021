/**
 * Тести Class_StepsManager.
 * Запуск: node --test ./processes/processManager/tests/test_Class_StepsManager.js
 */
const { describe, it } = require("node:test");
const { deepEqual, equal, match, throws } = require("node:assert");
const Class_StepsManager = require("../Class_StepsManager.js");

function stepType(mark) {
  return {
    createStep(props) {
      return { id: props.id, mark, tT: props.tT, name: props.name };
    },
  };
}

function manager() {
  const steps = new Class_StepsManager();
  steps.addStepType("description", stepType("description"));
  steps.addStepType("taskThermal", stepType("thermal"));
  return steps;
}

describe("Class_StepsManager", () => {
  it("addStepType відхиляє об'єкт без createStep і повторний тип", () => {
    const steps = new Class_StepsManager();
    throws(() => steps.addStepType("taskThermal", {}), /createStep/);
    steps.addStepType("taskThermal", stepType("thermal"));
    throws(() => steps.addStepType("taskThermal", stepType("thermal")), /уже зареєстровано/);
    equal(steps.stepsList.get("taskThermal").createStep({}).mark, "thermal");
  });

  it("getStep створює екземпляр за типом", () => {
    const steps = manager();
    const step = steps.getStep("taskThermal", { id: "st_1", tT: 110 });
    deepEqual(step, { id: "st_1", mark: "thermal", tT: 110, name: undefined });
  });

  it("getStep кидає помилку для невідомого типу", () => {
    const steps = manager();
    throws(() => steps.getStep("немає", {}), /невідомий тип/);
  });

  it("без гачка beforeProgramCreated дорівнює null", () => {
    equal(new Class_StepsManager().beforeProgramCreated, null);
  });

  it("beforeProgramCreated обробляє список до створення кроків", () => {
    const steps = new Class_StepsManager({
      beforeProgramCreated({ program }) {
        return program.map((step) =>
          step.type === "raw"
            ? { type: "taskThermal", tT: step.tT, name: step.name }
            : step,
        );
      },
    });
    steps.addStepType("description", stepType("description"));
    steps.addStepType("taskThermal", stepType("thermal"));
    const res = steps.createProgram([
      { type: "description", name: "після гачка" },
      { type: "raw", tT: 4 },
    ]);

    equal(res.err, null);
    equal(steps.program.tasks.length, 2);
    equal(steps.program.tasks[1].mark, "thermal");
    equal(steps.program.tasks[1].tT, 4);
  });

  it("createProgram збирає кроки за полем type і пропускає елемент без типу", () => {
    const steps = manager();
    const res = steps.createProgram([
      { type: "description", name: "Відпуск" },
      { tT: 1 },
      { type: "taskThermal", tT: 110 },
      { type: "taskThermal", tT: 330 },
    ]);

    equal(res.err, null);
    match(res.data.ua, /Відпуск/);
    equal(steps.program.tasks.length, 3);
    deepEqual(
      steps.program.tasks.map((step) => step.id),
      ["st_0", "st_2", "st_3"],
    );
    equal(steps.program.tasks[1].tT, 110);
    equal(steps.program.tasks[1].mark, "thermal");
  });

  it("createProgram приймає JSON-рядок", () => {
    const steps = manager();
    const res = steps.createProgram(
      JSON.stringify([
        { type: "description", name: "prg" },
        { type: "taskThermal", tT: 50 },
      ]),
    );
    equal(res.err, null);
    equal(steps.program.tasks[1].tT, 50);
  });

  it("незареєстрований description лишається заголовком програми", () => {
    const steps = new Class_StepsManager();
    steps.addStepType("taskThermal", stepType("thermal"));
    const res = steps.createProgram([
      { type: "description", fName: "prg05", description: "Відпуск" },
      { type: "taskThermal", tT: 110 },
    ]);
    equal(res.err, null);
    equal(steps.program.header.ua, "prg05");
    equal(steps.program.tasks.length, 1);
    equal(steps.program.tasks[0].tT, 110);
  });

  it("createProgram приймає застаріле поле id замість type", () => {
    const steps = manager();
    const res = steps.createProgram([
      { id: "description", name: "старе" },
      { id: "taskThermal", tT: 7 },
    ]);
    equal(res.err, null);
    equal(steps.program.tasks[1].mark, "thermal");
    equal(steps.program.tasks[1].tT, 7);
  });

  it("createProgram повертає помилку для порожнього списку і невідомого type", () => {
    const steps = manager();
    const empty = steps.createProgram([]);
    match(empty.err.ua, /порожня/);
    equal(empty.data, null);

    const unknown = steps.createProgram([
      { type: "description", name: "x" },
      { type: "інший" },
    ]);
    match(unknown.err.ua, /невідомий тип/);
    equal(unknown.data, null);
  });

  it("createProgram не замінює програму, поки вона виконується", () => {
    const steps = manager();
    steps.createProgram([
      { type: "description", name: "перша", fName: "перша" },
      { type: "taskThermal", tT: 10 },
    ]);
    steps.program.state._id = "going";
    const res = steps.createProgram([
      { type: "description", name: "друга" },
      { type: "taskThermal", tT: 20 },
    ]);
    match(res.err.ua, /режимі виконання/);
    equal(steps.program.header.ua, "перша");
    equal(steps.program.tasks[1].tT, 10);
  });
});
