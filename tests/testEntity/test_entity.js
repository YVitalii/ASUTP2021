/**
 * Взаємодія TasksManager і ProcessManager у тестовій сутності.
 * Запуск: node --test ./tests/testEntity/test_entity.js
 *
 * Опитування приладу і читання регістрів заглушені: тест не відкриває COM-порт.
 */
const { describe, it } = require("node:test");
const { deepEqual, equal } = require("node:assert");
const Iface = require("../../rs485/class_RS485_iface.js");
const Manager = require("../../devices/OWEN_TRM251/ManagerClassTRM251.js");
const ClassLoggerManager = require("../../controllers/loggerManager/ClassLoggerManager.js");
const ClassStep_TRM251_Thermal = require("../../devices/OWEN_TRM251/ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_ProgLoadToDev = require("../../devices/OWEN_TRM251/ClassStep_TRM251_ProgLoadToDev.js");
const ClassStep_TRM251_Start = require("../../devices/OWEN_TRM251/ClassStep_TRM251_Start.js");
const ClassStep_TRM251_Stop = require("../../devices/OWEN_TRM251/ClassStep_TRM251_Stop.js");

Iface.prototype.openPort = async function () {};
Iface.prototype.iterate = function () {};
Manager.prototype.getMode = async function () {};
Manager.prototype.getRegister = async function () {
  return 0;
};
ClassLoggerManager.prototype.start = async function () {};

const entity = require("./entity.js");

describe("entity: TasksManager і ProcessManager", () => {

  it("ProcessManager працює з тим самим TasksManager і його активною програмою", () => {
    const task = entity.tasksManager.getActiveTask();

    equal(entity.processManager.tasksManager, entity.tasksManager);
    equal(task.taskName, "prg02");
    equal(task.content[0].id, "description");
    equal(task.content[0].fName, "prg02");
    equal(task.content[0].description, "Колеса чавунні. Відпуск.");
    deepEqual(
      task.content.slice(1).map((step) => step.tT),
      [35, 45, 55, 65, 70, 75],
    );
  });

  it("ProcessManager збирає програму з активної програми TasksManager", () => {
    const task = entity.tasksManager.getActiveTask();
    entity.processManager.loadProgramFromTasks();

    const program = entity.processManager.program;
    equal(program.header.ua, task.content[0].fName);
    equal(program.comment.ua, task.content[0].description);
    equal(program.state._id, "waiting");
    equal(entity.processManager.listSteps[0].fName, task.content[0].fName);

    const thermals = program.tasks.filter(
      (step) => step.constructor.type === ClassStep_TRM251_Thermal.type,
    );
    equal(program.tasks[0].constructor.type, ClassStep_TRM251_ProgLoadToDev.type);
    equal(program.tasks[1].constructor.type, ClassStep_TRM251_Start.type);
    equal(program.tasks[1].regs.prN, 1);
    equal(program.tasks[1].regs.stN, 1);
    equal(program.tasks.at(-1).constructor.type, ClassStep_TRM251_Stop.type);
    equal(thermals.length, task.content.length - 1);
    deepEqual(
      thermals.map((step) => step.goal.tT),
      task.content.slice(1).map((step) => step.tT),
    );
    equal(thermals[0].goal.Pr, 1);
    equal(thermals[0].goal.St, 1);
    equal(thermals[0].goal.H, 5);
    equal(thermals[0].goal.Y, 5);
    equal(thermals[1].goal.Pr, 1);
    equal(thermals[1].goal.St, 2);
    equal(thermals[1].goal.Y, 66);
  });

  it("ProcessManager.getStates() повертає стан зібраної програми", () => {
    const task = entity.tasksManager.getActiveTask();
    entity.processManager.loadProgramFromTasks();

    const states = entity.processManager.getStates();

    equal(states._id, "waiting");
    equal(states.header.ua, task.content[0].fName);
    equal(states.comment.ua, task.content[0].description);
    equal(states.tasks.length, entity.processManager.program.tasks.length);
    deepEqual(
      states.tasks.map((step) => step._id),
      entity.processManager.program.tasks.map(() => "waiting"),
    );
    deepEqual(
      states.tasks.map((step) => step.header.ua),
      entity.processManager.program.tasks.map((step) => step.header.ua),
    );
    deepEqual(states, entity.processManager.program.getState());
  });
});
