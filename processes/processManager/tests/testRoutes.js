/**
 * Роутер processManager збігається з vue/settings.js.
 * Запуск: node --test ./processes/processManager/tests/testRoutes.js
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const processManagerRouter = require("../routes/index.js");

let server;
let baseUrl;
let startedWith;
let stopped;

function createManager() {
  startedWith = null;
  stopped = false;
  const heat = { id: "heat", tasks: [] };
  const hold = { id: "hold", tasks: [] };
  const program = {
    state: { _id: "waiting" },
    tasks: [{ id: "description", tasks: [] }, heat, hold],
    getState() {
      throw new Error("маршрут має читати processManager.getStates()");
    },
  };
  return {
    program,
    getStates() {
      return {
        id: "program",
        _id: program.state._id,
        tasks: program.tasks.map((task) => ({ id: task.id })),
      };
    },
    async start(stepN) {
      startedWith = stepN;
      return { err: null, data: { ua: "started", en: "started", ru: "started" } };
    },
    stop() {
      stopped = true;
    },
  };
}

async function post(urlPath, body) {
  const response = await fetch(baseUrl + urlPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return response.json();
}

describe("processManager router", { concurrency: false }, () => {
  before(async () => {
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.entity = { processManager: createManager() };
      next();
    });
    const entityApi = express.Router();
    processManagerRouter.mountProcessApi(entityApi);
    app.use("/entity/:id/processManager/", processManagerRouter);
    app.use("/entity/:id", entityApi);
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/entity/test/processManager`;
  });

  after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("POST /entity/:id/process/state повертає data.content", async () => {
    const response = await fetch(baseUrl.replace(/\/processManager$/, "") + "/process/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await response.json();
    assert.equal(json.err, null);
    assert.equal(json.data.content._id, "waiting");
  });

  it("POST /process/state повертає data.content", async () => {
    const json = await post("/process/state", {});
    assert.equal(json.err, null);
    assert.equal(json.data.content._id, "waiting");
    assert.deepEqual(
      json.data.content.tasks.map((task) => task.id),
      ["description", "heat", "hold"],
    );
  });

  it("POST /process/start бере stepId і передає індекс кроку", async () => {
    const json = await post("/process/start", { stepId: "hold" });
    assert.equal(json.err, null);
    assert.equal(startedWith, 2);
  });

  it("POST /process/start без stepId стартує з кроку 1", async () => {
    const json = await post("/process/start", {});
    assert.equal(json.err, null);
    assert.equal(startedWith, 1);
  });

  it("POST /process/stop повертає err null", async () => {
    const json = await post("/process/stop", {});
    assert.deepEqual(json, { err: null, data: null });
    assert.equal(stopped, true);
  });
});
