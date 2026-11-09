/**
 * Тести ClassProcessManager.
 * Запуск: node --test ./processes/processManager/tests/test_ClassProcessManager.js
 */
const { afterEach, describe, it } = require("node:test");
const { deepEqual, equal, match, ok, rejects, throws } = require("node:assert");
const ClassProcessManager = require("../ClassProcessManager.js");

const realSetTimeout = global.setTimeout;

afterEach(() => {
  global.setTimeout = realSetTimeout;
});

function program(name = "Відпуск") {
  return {
    header: { ua: name, en: name, ru: name },
    state: { _id: "waiting" },
    tasks: [{ id: "st_1" }],
    startedFrom: null,
    stopped: false,
    start(stepN) {
      this.startedFrom = stepN;
    },
    stop() {
      this.stopped = true;
    },
    getState() {
      return { _id: this.state._id, header: this.header, tasks: this.tasks };
    },
  };
}

function create(extra = {}) {
  const list = extra.list || [{ type: "description", name: "Відпуск" }];
  const built = extra.program || program(list[0] && list[0].name);
  const logger = {
    fileName: "tmp-log",
    _fileExtensions: { logger: ".log" },
    started: [],
    saved: [],
    fileManager: {
      exist() {
        return false;
      },
    },
    async start(fileName) {
      this.started.push(fileName);
    },
    async saveTasks(tasks) {
      this.saved.push(tasks);
    },
  };
  const steps = {
    tasksList: list,
    program: built,
    received: null,
    err: extra.err || null,
    stepSeparator: "_",
    getTaskNumberById(id = "") {
      return parseInt(String(id).split(this.stepSeparator)[1]);
    },
    createProgram(tasksList) {
      this.received = tasksList;
      if (this.err) return { err: this.err, data: null };
      return { err: null, data: { ua: "зі stepsManager" } };
    },
  };
  const tasksManager = {
    homeURL: "/entity/tasksManager",
    content: extra.content === undefined ? list : extra.content,
    getActiveTask() {
      return { content: this.content };
    },
  };

  const proc = new ClassProcessManager({
    homeURL: "/entity",
    homeDir: "e:\\tmp\\entity\\",
    ln: "testPM::",
    tasksManager,
    loggerManager: logger,
    devicesManager: {},
    stepsManager: steps,
    afterAll: extra.afterAll,
  });
  return { proc, steps, logger, list, built };
}

describe("ClassProcessManager", () => {
  function planTimers() {
    const planned = [];
    global.setTimeout = (fn, ms) => {
      planned.push({ fn, ms });
      return { unref() {} };
    };
    return planned;
  }

  it("конструктор планує читання програми через 3 секунди", () => {
    const planned = planTimers();
    const { steps } = create();

    equal(steps.received, null);
    equal(planned.length, 1);
    equal(planned[0].ms, 3000);
    planned[0].fn();
    deepEqual(steps.received, [{ type: "description", name: "Відпуск" }]);
  });

  it("повторює читання програми, поки TasksManager її не віддасть", () => {
    const planned = planTimers();
    const { proc } = create();
    let reads = 0;
    proc.tasksManager.getActiveTask = () => {
      reads += 1;
      if (reads < 3) return { content: [] };
      return { content: [{ type: "description", name: "Відпуск" }] };
    };

    planned[0].fn();
    planned[1].fn();
    equal(proc.program.header, undefined);
    planned[2].fn();

    equal(planned.length, 3);
    equal(proc.program.header.ua, "Відпуск");
    equal(proc.program.state._id, "waiting");
  });

  it("після трьох невдач пише помилку і зупиняє програму", () => {
    const planned = planTimers();
    const { proc } = create();
    proc.tasksManager.getActiveTask = () => {
      throw new Error("програма ще не готова");
    };
    let stopped = null;
    proc.program.error = (err) => {
      stopped = err;
      proc.program.state = { _id: "error", note: err };
    };

    planned[0].fn();
    planned[1].fn();
    planned[2].fn();

    equal(planned.length, 3);
    equal(proc.programLoadAttempt, 3);
    equal(stopped.ua, "Не вдалося отримати програму з TasksManager");
    equal(proc.program.state._id, "error");
  });

  it("конструктор вимагає менеджери", () => {
    throws(() => new ClassProcessManager({}), /TasksManager must be defined/);
    throws(
      () => new ClassProcessManager({ tasksManager: {} }),
      /loggerManager must be defined/,
    );
    throws(
      () =>
        new ClassProcessManager({
          tasksManager: {},
          loggerManager: {},
          devicesManager: {},
        }),
      /stepsManager must be defined/,
    );
  });

  it("setProgram зберігає програму зі stepsManager і скидає ім'я логу", () => {
    const { proc, steps, built, list } = create();
    const res = proc.setProgram();

    equal(res.err, null);
    match(res.data.ua, /Відпуск/);
    deepEqual(steps.received, list);
    equal(proc.program, built);
    equal(proc.listSteps, list);
    equal(proc.currLogFileName, null);
    equal(typeof proc.program.afterAll, "function");
    equal(proc.htmlProgram.states.logFileName, "tmp-log");
  });

  it("setProgram повертає помилку stepsManager і не підміняє програму", () => {
    const { proc } = create({ err: { ua: "програма порожня" } });
    const before = proc.program;
    const res = proc.setProgram();

    equal(res.data, null);
    equal(res.err.ua, "програма порожня");
    equal(proc.program, before);
    equal(proc.currLogFileName, undefined);
  });

  it("afterAll викликає зовнішню функцію і після finished скидає лог", async () => {
    let called = 0;
    const { proc, logger, built } = create({
      afterAll: async () => {
        called += 1;
      },
    });
    proc.setProgram();
    proc.currLogFileName = "2026-10-28_16-00";
    logger.started.length = 0;
    built.state._id = "finished";

    let delay;
    let restart;
    global.setTimeout = (fn, ms) => {
      delay = ms;
      restart = fn;
      return 1;
    };
    await proc.program.afterAll();

    equal(called, 1);
    equal(proc.currLogFileName, null);
    equal(delay, 15 * 60 * 1000);
    restart();
    deepEqual(logger.started, [undefined]);
  });

  it("afterAll при зупиненій програмі не скидає ім'я логу", async () => {
    const { proc, built } = create({
      afterAll: async () => {
        throw new Error("зовнішня помилка");
      },
    });
    proc.setProgram();
    proc.currLogFileName = "keep-log";
    built.state._id = "stoped";
    await proc.program.afterAll();
    equal(proc.currLogFileName, "keep-log");
  });

  it("start з кроку 1 збирає програму, відкриває лог і запускає крок", async () => {
    const { proc, built, logger, list } = create();
    proc.program = {
      state: { _id: "waiting" },
      header: { ua: "стара", en: "old", ru: "старая" },
      tasks: [{ id: "st_0" }, { id: "st_1" }],
    };
    const res = await proc.start();

    equal(res.err, null);
    match(res.data.ua, /почала виконання/);
    equal(proc.program, built);
    equal(built.startedFrom, 1);
    match(logger.started.at(-1), /^\d{4}-\d{2}-\d{2}_/);
    equal(logger.saved.length, 1);
    equal(logger.saved[0], list);
    ok(list[0].started);
  });

  it("start з кроку st_1 збирає програму, щоб кроки знову були waiting", async () => {
    const { proc, built } = create();
    proc.program = {
      state: { _id: "finished" },
      header: { ua: "prg03", en: "prg03", ru: "prg03" },
      tasks: [
        { id: "st_1", state: { _id: "error" } },
        { id: "st_2", goal: { Pr: 1, St: 1 }, state: { _id: "finished" } },
      ],
      start() {},
    };
    proc.listSteps = [{ name: "Відпуск" }];

    const res = await proc.start(0);

    equal(res.err, null);
    equal(proc.program, built);
    equal(built.startedFrom, 0);
  });

  it("start з іншого кроку не перезбирає програму і не змінює стани кроків", async () => {
    const { proc } = create();
    const current = {
      state: { _id: "finished" },
      header: { ua: "prg03", en: "prg03", ru: "prg03" },
      tasks: [
        { id: "st_1", state: { _id: "finished" } },
        { id: "st_2", goal: { Pr: 1, St: 1 }, state: { _id: "error" } },
      ],
      start(stepN) {
        this.startedFrom = stepN;
      },
    };
    proc.program = current;
    proc.listSteps = [{ name: "Відпуск" }];
    proc.currLogFileName = null;
    let rebuilt = 0;
    proc.setProgram = () => {
      rebuilt += 1;
    };

    const res = await proc.start(1);

    equal(res.err, null);
    equal(rebuilt, 0);
    equal(proc.program, current);
    equal(current.tasks[0].state._id, "finished");
    equal(current.tasks[1].state._id, "error");
    equal(current.startedFrom, 1);
  });

  it("start з іншого кроку лишає поточний лог, якщо ім'я вже є", async () => {
    const { proc, built, logger } = create();
    proc.program = built;
    proc.listSteps = [{ name: "Відпуск" }];
    proc.currLogFileName = "same-log";
    logger.started.length = 0;
    let rebuilt = 0;
    proc.setProgram = () => {
      rebuilt += 1;
      return { err: null };
    };

    const res = await proc.start(2);

    equal(res.err, null);
    equal(rebuilt, 0);
    deepEqual(logger.started, ["same-log"]);
    equal(built.startedFrom, 2);
  });

  it("start відмовляє, коли програма вже виконується", async () => {
    const { proc, built } = create();
    built.state._id = "going";
    proc.program = built;
    const res = await proc.start(1);

    equal(res.data, null);
    match(res.err.ua, /вже/);
    equal(built.startedFrom, null);
  });

  it("start(\"st_1\") передає в програму номер з id", async () => {
    const { proc, built } = create();
    proc.program = built;
    proc.listSteps = [{ name: "Відпуск" }];
    proc.currLogFileName = "keep-log";

    const res = await proc.start("st_1");

    equal(res.err, null);
    equal(built.startedFrom, 1);
  });

  it("start кидає помилку для номера кроку, який не є числом", async () => {
    const { proc } = create();
    await rejects(() => proc.start("крок"), /Invalid step number/);
  });

  it("stop зупиняє лише програму в стані going", async () => {
    const { proc, built } = create();
    proc.program = built;
    await proc.stop();
    equal(built.stopped, false);

    built.state._id = "going";
    await proc.stop();
    equal(built.stopped, true);
  });

  it("generateLogFileName додає суфікс, якщо файл уже є", () => {
    const { proc, logger } = create();
    let calls = 0;
    logger.fileManager.exist = () => {
      calls += 1;
      return calls === 1;
    };
    const name = proc.generateLogFileName();
    equal(calls, 2);
    ok(name.endsWith("-1"));
  });

  it("getStates у going віддає зібрану програму і не перезбирає", () => {
    const { proc, steps, built } = create();
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg01",
      lastChange: 1,
      content: [{ type: "description", name: "Відпуск" }],
    });
    proc.setProgram();
    built.state._id = "going";
    let calls = 0;
    steps.createProgram = () => {
      calls += 1;
      return { err: null, data: null };
    };
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg02",
      lastChange: 2,
      content: [{ type: "description", name: "Нова" }],
    });

    const state = proc.getStates();

    equal(calls, 0);
    equal(state._id, "going");
    equal(state.header.ua, "Відпуск");
    equal(proc.program, built);
  });

  it("getStates у waiting збирає нову програму, якщо змінилась назва або час", () => {
    const { proc, steps } = create();
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg01",
      lastChange: 1,
      content: [{ type: "description", name: "Відпуск" }],
    });
    proc.setProgram();
    const fresh = program("Нова");
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg02",
      lastChange: 2,
      content: [{ type: "description", name: "Нова" }],
    });
    steps.createProgram = (tasksList) => {
      steps.received = tasksList;
      steps.program = fresh;
      return { err: null, data: { ua: "ok" } };
    };

    const state = proc.getStates();

    deepEqual(steps.received, [{ type: "description", name: "Нова" }]);
    equal(proc.program, fresh);
    equal(state.header.ua, "Нова");
    equal(state._id, "waiting");
    equal(proc.loadedTask.name, "prg02");
    equal(proc.loadedTask.lastChange, 2);

    steps.received = null;
    const again = proc.getStates();
    equal(steps.received, null);
    equal(again.header.ua, "Нова");
    equal(again._id, "waiting");
  });

  it("getStates після завершення збирає нову активну програму", () => {
    const { proc, steps, built } = create();
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg03",
      lastChange: 1,
      content: [{ type: "description", fName: "prg03", name: "prg03" }],
    });
    proc.setProgram();
    built.state._id = "finished";
    const fresh = program("prg02");
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg02",
      lastChange: 2,
      content: [{ type: "description", fName: "prg02", name: "prg02" }],
    });
    steps.createProgram = (tasksList) => {
      steps.received = tasksList;
      steps.program = fresh;
      return { err: null, data: { ua: "ok" } };
    };

    const state = proc.getStates();

    equal(steps.received[0].fName, "prg02");
    equal(proc.program, fresh);
    equal(state.header.ua, "prg02");
    equal(proc.loadedTask.name, "prg02");
  });

  it("getStates у waiting перезбирає програму, якщо змінився лише час редагування", () => {
    const { proc, steps } = create();
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg01",
      lastChange: 1,
      content: [{ type: "description", name: "Відпуск" }],
    });
    proc.setProgram();
    const fresh = program("Відпуск");
    let calls = 0;
    proc.tasksManager.getActiveTask = () => ({
      taskName: "prg01",
      lastChange: 9,
      content: [{ type: "description", name: "Відпуск" }],
    });
    steps.createProgram = () => {
      calls += 1;
      steps.program = fresh;
      return { err: null, data: { ua: "ok" } };
    };

    proc.getStates();

    equal(calls, 1);
    equal(proc.loadedTask.lastChange, 9);
  });

  it("getHtmlProgram оновлює стан не частіше ніж раз на 10 секунд", () => {
    const { proc, built } = create();
    proc.program = built;
    let calls = 0;
    built.getState = () => {
      calls += 1;
      return { _id: built.state._id, tasks: [] };
    };
    proc.htmlProgram.lastUpdate = 0;
    const first = proc.getHtmlProgram();
    const second = proc.getHtmlProgram();

    equal(calls, 1);
    equal(second, first);
    equal(first.logFileName, "tmp-log");
  });
});
