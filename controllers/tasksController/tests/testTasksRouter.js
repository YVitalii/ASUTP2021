/**
 * Тести роутера tasksController.
 * Запуск: node --test ./controllers/tasksController/tests/testTasksRouter.js
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const ClassTasksManager = require("../ClassTasksManager.js");
const tasksRouter = require("../routes/index.js");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-router-"));
const programBody = [{ id: "description", name: "test", note: "" }];

let manager;
let server;
let baseUrl;

function caseDir(name) {
  return path.join(root, name);
}

function createManager(dir) {
  const programDir = path.join(dir, "tasksManager", "tasksList");
  fs.mkdirSync(programDir, { recursive: true });
  fs.writeFileSync(
    path.join(programDir, "default"),
    JSON.stringify(programBody)
  );
  return new ClassTasksManager({
    homeDir: dir,
    homeURL: "/entity/test",
  });
}

async function post(urlPath, body) {
  const response = await fetch(baseUrl + urlPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const json = await response.json();
  return { status: response.status, json };
}

describe("tasksController router", { concurrency: false }, () => {
  before(async () => {
    manager = createManager(caseDir("main"));
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.entity = manager ? { tasksManager: manager } : {};
      req.user = { lang: "ua" };
      req.info = {
        mainPug: path.resolve(__dirname, "../../../views/main.pug"),
      };
      next();
    });
    app.use(tasksRouter);
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
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

  it("GET / показує сторінку редагування програми", async () => {
    const response = await fetch(baseUrl + "/");
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /id="tasksManager"/);
    assert.match(html, /\/src\/tasksManager\/tasksManager\.js/);
  });

  it("POST /getFilesList повертає назви програм", async () => {
    const { json } = await post("/getFilesList", {});
    assert.equal(json.err, null);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.includes("default"));
  });

  it("POST /readFile повертає розібраний вміст програми", async () => {
    const { json } = await post("/readFile", { fileName: "default" });
    assert.equal(json.err, null);
    assert.deepEqual(json.data, programBody);
  });

  it("POST /readFile без файлу повертає err", async () => {
    const { json } = await post("/readFile", { fileName: "missing" });
    assert.equal(json.data, null);
    assert.equal(typeof json.err.ua, "string");
    assert.equal(typeof json.err.en, "string");
    assert.equal(typeof json.err.ru, "string");
  });

  it("POST /writeFile зберігає програму і повертає fileName", async () => {
    const content = [{ id: "description", name: "prg02", note: "new" }];
    const { json } = await post("/writeFile", {
      fileName: "prg02",
      content,
    });
    assert.equal(json.err, null);
    assert.deepEqual(json.data, { fileName: "prg02" });

    const list = await post("/getFilesList", {});
    assert.ok(list.json.data.includes("prg02"));

    const read = await post("/readFile", { fileName: "prg02" });
    assert.deepEqual(read.json.data, content);
  });

  it("POST /writeFile без content повертає err", async () => {
    const { json } = await post("/writeFile", { fileName: "empty" });
    assert.equal(json.data, null);
    assert.match(json.err.en, /content are required/);
  });

  it("POST /deleteFile видаляє програму і повертає fileName", async () => {
    await post("/writeFile", {
      fileName: "to-delete",
      content: programBody,
    });
    const { json } = await post("/deleteFile", { fileName: "to-delete" });
    assert.equal(json.err, null);
    assert.deepEqual(json.data, { fileName: "to-delete" });

    const list = await post("/getFilesList", {});
    assert.equal(list.json.data.includes("to-delete"), false);
  });

  it("POST /deleteFile неіснуючого файлу повертає err", async () => {
    const { json } = await post("/deleteFile", { fileName: "absent" });
    assert.equal(json.data, null);
    assert.match(json.err.en, /not found/);
  });

  it("POST /acceptFile встановлює активну програму", async () => {
    await post("/writeFile", {
      fileName: "prg01",
      content: programBody,
    });
    const { json } = await post("/acceptFile", { fileName: "prg01" });
    assert.equal(json.err, null);
    assert.deepEqual(json.data, { fileName: "prg01" });
    assert.equal(manager.activeTask.fileName, "prg01");
  });

  it("POST /acceptFile неіснуючого файлу повертає err {ua,en,ru}", async () => {
    const { json } = await post("/acceptFile", { fileName: "no-such" });
    assert.equal(json.data, null);
    assert.equal(typeof json.err.ua, "string");
    assert.equal(typeof json.err.en, "string");
    assert.equal(typeof json.err.ru, "string");
    assert.match(json.err.en, /not found/);
  });

  it("POST /getProcessState повертає прийняту програму зі списку", async () => {
    const { json } = await post("/getProcessState", {});
    assert.equal(json.err, null);
    assert.equal(json.data.programRunning, false);
    assert.equal(json.data.acceptedProgram, manager.activeTask.fileName);
    assert.ok(manager.getTasksList().includes(json.data.acceptedProgram));
  });

  it("POST /getProcessState повертає err, якщо активної назви немає в списку", async () => {
    const savedName = manager.activeTask.fileName;
    const savedList = manager.tasksList.slice();
    manager.activeTask.fileName = "not-in-list";
    try {
      const { json } = await post("/getProcessState", {});
      assert.equal(json.data, null);
      assert.match(json.err.en, /not in the list/);
    } finally {
      manager.activeTask.fileName = savedName;
      manager.tasksList = savedList;
    }
  });

  it("POST /getTasksDescription повертає описи типів", async () => {
    manager.addTaskType({
      id: "heat",
      getDescription() {
        return { id: "heat", title: "Нагрів" };
      },
    });
    const { json } = await post("/getTasksDescription", {});
    assert.equal(json.err, null);
    assert.equal(Array.isArray(json.data), false);
    assert.ok(json.data.description);
    assert.equal(json.data.heat.title, "Нагрів");
  });

  it("без tasksManager повертає err і data null", async () => {
    const current = manager;
    manager = null;
    try {
      const { json } = await post("/getFilesList", {});
      assert.equal(json.data, null);
      assert.match(json.err.en, /not defined/);
    } finally {
      manager = current;
    }
  });
});
