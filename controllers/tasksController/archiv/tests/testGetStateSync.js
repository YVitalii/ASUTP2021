/**
 * Перевірка ClassTasksManager.getStateSync().
 * Запуск: node --test ./controllers/tasksController/tests/testGetStateSync.js
 */
const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ClassTasksManager = require("../ClassTasksManager.js");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-manager-getStateSync-"));

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
    homeURL: "/entity/test",
  });
}

const programBody = JSON.stringify([
  { id: "description", name: "test", note: "" },
]);

async function waitForProgram(manager) {
  const started = Date.now();
  while (!Array.isArray(manager.list) || manager.list.length === 0) {
    if (Date.now() - started > 2000) {
      throw new Error("Програма не завантажилась");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe("ClassTasksManager.getStateSync()", () => {
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

  it("створює каталоги і кидає помилку, якщо немає файлу default", () => {
    const dir = caseDir("no-default");
    assert.throws(() => createManager(dir), /"default" не знайдено/);
    assert.equal(fs.existsSync(tasksHome(dir)), true);
    assert.equal(fs.existsSync(programDir(dir)), true);
    assert.equal(fs.existsSync(stateFile(dir)), false);
  });

  it("створює state.info зі value default, якщо файл default уже є", async () => {
    const dir = caseDir("with-default");
    fs.mkdirSync(programDir(dir), { recursive: true });
    fs.writeFileSync(path.join(programDir(dir), "default"), programBody);

    const manager = createManager(dir);
    await waitForProgram(manager);

    assert.equal(manager.value, "default");
    assert.deepEqual(JSON.parse(fs.readFileSync(stateFile(dir), "utf8")), {
      value: "default",
    });
  });

  it("читає збережене ім'я програми з наявного state.info", async () => {
    const dir = caseDir("with-state");
    fs.mkdirSync(programDir(dir), { recursive: true });
    fs.writeFileSync(path.join(programDir(dir), "prg01"), programBody);
    fs.writeFileSync(stateFile(dir), JSON.stringify({ value: "prg01" }));

    const manager = createManager(dir);
    await waitForProgram(manager);

    assert.equal(manager.value, "prg01");
    assert.deepEqual(JSON.parse(fs.readFileSync(stateFile(dir), "utf8")), {
      value: "prg01",
    });
  });
});
