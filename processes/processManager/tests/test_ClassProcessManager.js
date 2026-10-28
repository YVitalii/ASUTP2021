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
    listSteps: list,
    program: built,
    received: null,
    err: extra.err || null,
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

  it("start кидає помилку для номера кроку, який не є числом", async () => {
    const { proc } = create();
    await rejects(() => proc.start("крок"), /Invalid step number/);
  });

  it("stop зупиняє лише програму в стані going", () => {
    const { proc, built } = create();
    proc.program = built;
    proc.stop();
    equal(built.stopped, false);

    built.state._id = "going";
    proc.stop();
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
