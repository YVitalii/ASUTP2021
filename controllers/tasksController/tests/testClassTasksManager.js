/**
 * Тести ClassTasksManager (constructor + initSync + loadTask + readTasksList + saveTask).
 * Запуск: node --test ./controllers/tasksController/tests/testClassTasksManager.js
 */
const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ClassTasksManager = require("../ClassTasksManager.js");

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), "tasks-manager-ClassTasksManager-")
);

function caseDir(name) {
  return path.join(root, name);
}

function tasksHome(dir) {
  return path.join(dir, "tasksManager");
}

function programDir(dir) {
  return path.join(tasksHome(dir), "tasksList");
}

function stateFile(dir) {
  return path.join(tasksHome(dir), "state.info");
}

function createManager(dir) {
  return new ClassTasksManager({
    homeDir: dir,
    homeUrl: "/entity/test",
  });
}

function assertApiError(err, expected) {
  assert.ok(err && err.msg, "очікується APIerror з полем msg");
  assert.equal(err.msg.ua, expected.ua);
  assert.equal(err.msg.en, expected.en);
  assert.equal(err.msg.ru, expected.ru);
  return true;
}

const programSteps = [{ id: "description", name: "test", note: "" }];
const programBody = JSON.stringify(programSteps);

describe("ClassTasksManager", () => {
  after(async () => {
    for (let i = 0; i < 10; i++) {
      try {
        fs.rmSync(root, { recursive: true, force: true });
        return;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("кидає помилку, якщо homeDir не передано", () => {
      assert.throws(
        () => new ClassTasksManager({}),
        (err) =>
          assertApiError(err, {
            ua: "Не вказано домашню директорію (homeDir)",
            en: "Home directory (homeDir) is not defined",
            ru: "Не указана домашняя директория (homeDir)",
          })
      );
    });

    it("ініціалізує path, activeTask, tasksList і fileManager", () => {
      const dir = caseDir("ctor-ok");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);

      const manager = createManager(dir);

      assert.match(manager.path.homeDir, /tasksManager/);
      assert.match(manager.path.programDir, /tasksList/);
      assert.match(manager.path.stateFile, /state\.info$/);
      assert.equal(manager.path.homeURL, "/entity/test/tasksManager/");
      assert.ok(manager.fileManager);
      assert.equal(manager.activeTask.fileName, "default");
      assert.deepEqual(manager.activeTask.content, programSteps);
    });
  });

  describe("initSync()", () => {
    it("кидає помилку, якщо немає файлу default і немає state.info", () => {
      const dir = caseDir("no-default");
      fs.mkdirSync(programDir(dir), { recursive: true });

      assert.throws(
        () => createManager(dir),
        (err) =>
          assertApiError(err, {
            ua: "Файл шаблону програми (default) не знайдено",
            en: "Default program template file not found",
            ru: "Файл шаблона программы (default) не найден",
          })
      );
      assert.equal(fs.existsSync(stateFile(dir)), false);
    });

    it("створює state.info з activeProgram=default, якщо файл default є", () => {
      const dir = caseDir("with-default");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);

      const before = Date.now();
      const manager = createManager(dir);
      const after = Date.now();

      const state = JSON.parse(fs.readFileSync(stateFile(dir), "utf8"));
      assert.equal(state.activeProgram, "default");
      assert.equal(typeof state.lastChange, "number");
      assert.ok(state.lastChange >= before && state.lastChange <= after);

      assert.equal(manager.activeTask.fileName, "default");
      assert.deepEqual(manager.activeTask.content, programSteps);
      assert.ok(manager.tasksList.includes("default"));
    });

    it("читає активну програму з наявного state.info", () => {
      const dir = caseDir("with-state");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      fs.writeFileSync(
        stateFile(dir),
        JSON.stringify({ activeProgram: "prg01", lastChange: 123 })
      );

      const manager = createManager(dir);

      assert.equal(manager.activeTask.fileName, "prg01");
      assert.deepEqual(manager.activeTask.content, programSteps);
      assert.deepEqual(JSON.parse(fs.readFileSync(stateFile(dir), "utf8")), {
        activeProgram: "prg01",
        lastChange: 123,
      });
      assert.ok(manager.tasksList.includes("prg01"));
    });

    it("читає старий формат state.info {value} і мігрує до activeProgram", () => {
      const dir = caseDir("legacy-state");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(stateFile(dir), JSON.stringify({ value: "default" }));

      const manager = createManager(dir);

      assert.equal(manager.activeTask.fileName, "default");
      assert.deepEqual(manager.activeTask.content, programSteps);
      const state = JSON.parse(fs.readFileSync(stateFile(dir), "utf8"));
      assert.equal(state.activeProgram, "default");
      assert.equal(typeof state.lastChange, "number");
      assert.equal(state.value, undefined);
    });

    it("заповнює tasksList зі списку файлів у programDir", () => {
      const dir = caseDir("tasks-list");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg03"), programBody);

      const manager = createManager(dir);

      assert.deepEqual(manager.tasksList.slice().sort(), [
        "default",
        "prg01",
        "prg03",
      ]);
    });

    it("не перезаписує наявний state.info", () => {
      const dir = caseDir("keep-state");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      const saved = { activeProgram: "prg01", lastChange: 42 };
      fs.writeFileSync(stateFile(dir), JSON.stringify(saved));

      createManager(dir);

      assert.deepEqual(
        JSON.parse(fs.readFileSync(stateFile(dir), "utf8")),
        saved
      );
    });
  });

  describe("loadTask()", () => {
    it("без taskName повертає this.activeTask.content", async () => {
      const dir = caseDir("load-active");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);

      const manager = createManager(dir);
      const content = await manager.loadTask();

      assert.equal(content, manager.activeTask.content);
      assert.deepEqual(content, programSteps);
    });

    it("з taskName читає файл і повертає JSON.parse", async () => {
      const dir = caseDir("load-named");
      const otherBody = [{ id: "description", name: "other", note: "x" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(
        path.join(programDir(dir), "prg01"),
        JSON.stringify(otherBody)
      );

      const manager = createManager(dir);
      const content = await manager.loadTask("prg01");

      assert.deepEqual(content, otherBody);
    });
  });

  describe("readTasksList()", () => {
    it("оновлює this.tasksList і повертає масив імен файлів", async () => {
      const dir = caseDir("read-list");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);

      const manager = createManager(dir);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg03"), programBody);

      const list = await manager.readTasksList();

      assert.equal(list, manager.tasksList);
      assert.ok(Array.isArray(list));
      assert.deepEqual(list.slice().sort(), ["default", "prg01", "prg03"]);
    });
  });

  describe("getTasksList()", () => {
    it("повертає this.tasksList", () => {
      const dir = caseDir("get-list");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);

      const manager = createManager(dir);

      assert.equal(manager.getTasksList(), manager.tasksList);
      assert.deepEqual(manager.getTasksList().slice().sort(), [
        "default",
        "prg01",
      ]);
    });
  });

  describe("saveTask()", () => {
    it("кидає помилку, якщо не вказано taskName або content", async () => {
      const dir = caseDir("save-args");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      const required = {
        ua: "Потрібно вказати taskName та content",
        en: "taskName and content are required",
        ru: "Необходимо указать taskName и content",
      };
      await assert.rejects(() => manager.saveTask(), (err) =>
        assertApiError(err, required)
      );
      await assert.rejects(() => manager.saveTask("prg01"), (err) =>
        assertApiError(err, required)
      );
      await assert.rejects(
        () => manager.saveTask(undefined, programBody),
        (err) => assertApiError(err, required)
      );
    });

    it("не записує шаблон default", async () => {
      const dir = caseDir("save-default");
      const updated = [{ id: "description", name: "updated", note: "ok" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      await assert.rejects(() => manager.saveTask("default", updated), (err) =>
        assertApiError(err, {
          ua: "Не можна змінювати шаблон програми",
          en: "Cannot modify the program template",
          ru: "Нельзя изменять шаблон программы",
        })
      );      assert.equal(
        fs.readFileSync(path.join(programDir(dir), "default"), "utf8"),
        programBody
      );
    });

    it("створює новий файл у programDir і додає його до tasksList", async () => {
      const dir = caseDir("save-create");
      const body = [{ id: "description", name: "new", note: "" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      assert.equal(manager.tasksList.includes("prg01"), false);
      await manager.saveTask("prg01", body);

      const saved = fs.readFileSync(path.join(programDir(dir), "prg01"), "utf8");
      assert.deepEqual(JSON.parse(saved), body);
      assert.ok(manager.tasksList.includes("prg01"));
    });

    it("перезаписує існуючий файл без дубля в tasksList", async () => {
      const dir = caseDir("save-overwrite");
      const updated = [{ id: "description", name: "updated", note: "ok" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      const manager = createManager(dir);
      const beforeCount = manager.tasksList.filter((n) => n === "prg01").length;

      await manager.saveTask("prg01", updated);

      const saved = fs.readFileSync(path.join(programDir(dir), "prg01"), "utf8");
      assert.deepEqual(JSON.parse(saved), updated);
      assert.equal(
        manager.tasksList.filter((n) => n === "prg01").length,
        beforeCount
      );
    });
  });

  describe("deleteTask()", () => {
    it("кидає помилку, якщо не вказано taskName", async () => {
      const dir = caseDir("delete-args");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      await assert.rejects(() => manager.deleteTask(), (err) =>
        assertApiError(err, {
          ua: "Потрібно вказати taskName",
          en: "taskName is required",
          ru: "Необходимо указать taskName",
        })
      );
    });

    it("кидає помилку, якщо файл не існує", async () => {
      const dir = caseDir("delete-missing");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      await assert.rejects(() => manager.deleteTask("missing"), (err) =>
        assertApiError(err, {
          ua: "Файл програми не знайдено: missing",
          en: "Task file not found: missing",
          ru: "Файл программы не найден: missing",
        })
      );
    });

    it("не видаляє шаблон default", async () => {
      const dir = caseDir("delete-default");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      const manager = createManager(dir);
      await manager.setActiveTask("prg01");

      await assert.rejects(() => manager.deleteTask("default"), (err) =>
        assertApiError(err, {
          ua: "Не можна видаляти шаблон програми",
          en: "Cannot delete the program template",
          ru: "Нельзя удалять шаблон программы",
        })
      );
      assert.equal(fs.existsSync(path.join(programDir(dir), "default")), true);
    });

    it("не видаляє активну програму", async () => {
      const dir = caseDir("delete-active");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      const manager = createManager(dir);
      await manager.setActiveTask("prg01");

      await assert.rejects(() => manager.deleteTask("prg01"), (err) =>
        assertApiError(err, {
          ua: "Не можна видаляти активну програму",
          en: "Cannot delete the active program",
          ru: "Нельзя удалять активную программу",
        })
      );
      assert.equal(fs.existsSync(path.join(programDir(dir), "prg01")), true);
    });

    it("видаляє файл і прибирає його з tasksList", async () => {
      const dir = caseDir("delete-ok");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
      const manager = createManager(dir);

      await manager.deleteTask("prg01");

      assert.equal(fs.existsSync(path.join(programDir(dir), "prg01")), false);
      assert.equal(manager.tasksList.includes("prg01"), false);
      assert.ok(manager.tasksList.includes("default"));
    });
  });

  describe("getFullHtml()", () => {
    it("рендерить pug і повертає html з контейнером tasksManager", () => {
      const dir = caseDir("get-html");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      const html = manager.getFullHtml();

      assert.equal(typeof html, "string");
      assert.match(html, /id="tasksManager"/);
      assert.match(html, /tasksManager\.js/);
      assert.match(html, /tasksManager\.css/);
    });
  });

  describe("getActiveTask()", () => {
    it("повертає taskName і копію content", async () => {
      const dir = caseDir("get-active");
      const otherBody = [{ id: "description", name: "test", note: "" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(
        path.join(programDir(dir), "prg01"),
        JSON.stringify(otherBody)
      );
      const manager = createManager(dir);
      await manager.setActiveTask("prg01");

      const result = manager.getActiveTask();

      assert.equal(result.taskName, "prg01");
      assert.deepEqual(result.content, otherBody);
      assert.notEqual(result.content, manager.activeTask.content);
      result.content[0].name = "mutated";
      assert.equal(manager.activeTask.content[0].name, "test");
    });
  });

  describe("setActiveTask()", () => {
    it("кидає помилку, якщо taskName не існує", async () => {
      const dir = caseDir("set-missing");
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      const manager = createManager(dir);

      await assert.rejects(() => manager.setActiveTask(), (err) =>
        assertApiError(err, {
          ua: "Файл програми не знайдено: undefined",
          en: "Task file not found: undefined",
          ru: "Файл программы не найден: undefined",
        })
      );
      await assert.rejects(() => manager.setActiveTask("missing"), (err) =>
        assertApiError(err, {
          ua: "Файл програми не знайдено: missing",
          en: "Task file not found: missing",
          ru: "Файл программы не найден: missing",
        })
      );
    });

    it("встановлює activeTask і переписує state.info", async () => {
      const dir = caseDir("set-ok");
      const otherBody = [{ id: "description", name: "other", note: "x" }];
      fs.mkdirSync(programDir(dir), { recursive: true });
      fs.writeFileSync(path.join(programDir(dir), "default"), programBody);
      fs.writeFileSync(
        path.join(programDir(dir), "prg01"),
        JSON.stringify(otherBody)
      );
      const manager = createManager(dir);

      const before = Date.now();
      await manager.setActiveTask("prg01");
      const after = Date.now();

      assert.equal(manager.activeTask.fileName, "prg01");
      assert.deepEqual(manager.activeTask.content, otherBody);

      const state = JSON.parse(fs.readFileSync(stateFile(dir), "utf8"));
      assert.equal(state.activeProgram, "prg01");
      assert.equal(typeof state.lastChange, "number");
      assert.ok(state.lastChange >= before && state.lastChange <= after);
    });
  });
});
