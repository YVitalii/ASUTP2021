/**
 * Тести Class_StepsManager.
 * Запуск: node --test ./processes/processManager/tests/test_Class_StepsManager.js
 */
const { describe, it } = require("node:test");
const { deepEqual, equal, match, ok, throws } = require("node:assert");
const Class_StepsManager = require("../Class_StepsManager.js");
const ClassStepsParallel = require("../../../controllers/ClassStep/ClassStepsParallel.js");

function stepType(mark) {
  return {
    createStep(props, device) {
      return {
        id: props.id,
        mark,
        tT: props.tT,
        name: props.name,
        device: props.device !== undefined ? props.device : device,
      };
    },
  };
}

const furnace = { id: "furnace" };
const devices = furnace;

function manager(devs = devices) {
  const steps = new Class_StepsManager();
  steps.addStepType("description", stepType("description"), devs);
  steps.addStepType("taskThermal", stepType("thermal"), devs);
  return steps;
}

describe("Class_StepsManager", () => {
  describe("addStepType()", () => {
    it("відхиляє об'єкт без createStep, без devices і повторний тип", () => {
      const steps = new Class_StepsManager();
      throws(() => steps.addStepType("taskThermal", {}, devices), /createStep/);
      throws(
        () => steps.addStepType("taskThermal", stepType("thermal")),
        /devices/,
      );
      throws(
        () => steps.addStepType("taskThermal", stepType("thermal"), null),
        /devices/,
      );
      steps.addStepType("taskThermal", stepType("thermal"), devices);
      throws(
        () => steps.addStepType("taskThermal", stepType("thermal"), devices),
        /уже зареєстровано/,
      );
      equal(steps.stepsList.get("taskThermal").createStep({}).mark, "thermal");
      equal(steps.stepDevices.get("taskThermal"), devices);
    });

    it("зберігає масив devices у stepDevices", () => {
      const steps = new Class_StepsManager();
      const list = [{ id: "d1" }, { id: "d2" }];
      steps.addStepType("taskThermal", stepType("thermal"), list);
      deepEqual(steps.stepDevices.get("taskThermal"), list);
    });
  });

  describe("getStep()", () => {
    it("створює екземпляр і передає один device", () => {
      const steps = manager();
      const step = steps.getStep("taskThermal", { id: "st_1", tT: 110 });
      deepEqual(step, {
        id: "st_1",
        mark: "thermal",
        tT: 110,
        name: undefined,
        device: furnace,
      });
    });

    it("для масиву з одним device не створює ClassStepsParallel", () => {
      const steps = new Class_StepsManager();
      const d1 = { id: "d1" };
      steps.addStepType("taskThermal", stepType("thermal"), [d1]);
      const step = steps.getStep("taskThermal", { id: "st_1", tT: 50 });
      equal(step instanceof ClassStepsParallel, false);
      equal(step.device, d1);
      equal(step.tT, 50);
    });

    it("для кількох devices повертає ClassStepsParallel", () => {
      const steps = new Class_StepsManager();
      const d1 = { id: "d1" };
      const d2 = { id: "d2" };
      steps.addStepType("taskThermal", stepType("thermal"), [d1, d2]);
      const step = steps.getStep("taskThermal", {
        id: "st_1",
        tT: 110,
        header: { ua: "паралель", en: "parallel", ru: "параллель" },
      });
      ok(step instanceof ClassStepsParallel);
      equal(step.tasks.length, 2);
      equal(step.tasks[0].device, d1);
      equal(step.tasks[1].device, d2);
      equal(step.tasks[0].tT, 110);
      equal(step.tasks[1].tT, 110);
      equal(step.id, "st_1");
      equal(step.header.ua, "паралель");
    });

    it("кидає помилку для невідомого типу", () => {
      const steps = manager();
      throws(() => steps.getStep("немає", {}), /невідомий тип/);
    });
  });

  describe("beforeProgramCreated", () => {
    it("без гачка дорівнює null", () => {
      equal(new Class_StepsManager().beforeProgramCreated, null);
    });

    it("обробляє список до створення кроків", () => {
      const steps = new Class_StepsManager({
        beforeProgramCreated({ program }) {
          return program.map((step) =>
            step.type === "raw"
              ? { type: "taskThermal", tT: step.tT, name: step.name }
              : step,
          );
        },
      });
      steps.addStepType("description", stepType("description"), devices);
      steps.addStepType("taskThermal", stepType("thermal"), devices);
      const res = steps.createProgram([
        { type: "description", name: "після гачка" },
        { type: "raw", tT: 4 },
      ]);

      equal(res.err, null);
      equal(steps.program.tasks.length, 2);
      equal(steps.program.tasks[1].mark, "thermal");
      equal(steps.program.tasks[1].tT, 4);
      equal(steps.program.tasks[1].device, furnace);
    });
  });

  describe("createProgram()", () => {
    it("збирає кроки за type, пропускає елемент без типу, передає device", () => {
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
      equal(steps.program.tasks[1].device, furnace);
      equal(steps.program.tasks[2].device, furnace);
    });

    it("для кількох devices будує ClassStepsParallel у програмі", () => {
      const d1 = { id: "d1" };
      const d2 = { id: "d2" };
      const steps = manager([d1, d2]);
      const res = steps.createProgram([
        { type: "description", name: "дві зони", fName: "prg" },
        { type: "taskThermal", tT: 200 },
      ]);
      equal(res.err, null);
      equal(steps.program.tasks.length, 2);
      ok(steps.program.tasks[1] instanceof ClassStepsParallel);
      equal(steps.program.tasks[1].tasks.length, 2);
      equal(steps.program.tasks[1].tasks[0].device, d1);
      equal(steps.program.tasks[1].tasks[1].device, d2);
    });

    it("приймає JSON-рядок", () => {
      const steps = manager();
      const res = steps.createProgram(
        JSON.stringify([
          { type: "description", name: "prg" },
          { type: "taskThermal", tT: 50 },
        ]),
      );
      equal(res.err, null);
      equal(steps.program.tasks[1].tT, 50);
      equal(steps.program.tasks[1].device, furnace);
    });

    it("незареєстрований description лишається заголовком програми", () => {
      const steps = new Class_StepsManager();
      steps.addStepType("taskThermal", stepType("thermal"), devices);
      const res = steps.createProgram([
        { type: "description", fName: "prg05", description: "Відпуск" },
        { type: "taskThermal", tT: 110 },
      ]);
      equal(res.err, null);
      equal(steps.program.header.ua, "prg05");
      equal(steps.program.tasks.length, 1);
      equal(steps.program.tasks[0].tT, 110);
      equal(steps.program.tasks[0].device, furnace);
    });

    it("приймає застаріле поле id замість type", () => {
      const steps = manager();
      const res = steps.createProgram([
        { id: "description", name: "старе" },
        { id: "taskThermal", tT: 7 },
      ]);
      equal(res.err, null);
      equal(steps.program.tasks[1].mark, "thermal");
      equal(steps.program.tasks[1].tT, 7);
    });

    it("повертає помилку для порожнього списку і невідомого type", () => {
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

    it("не замінює програму, поки вона виконується", () => {
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
});
