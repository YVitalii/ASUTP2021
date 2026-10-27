/**
 * Тести programTRM251_beforeAll.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_programTRM251_beforeAll.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const programTRM251_beforeAll = require("../programTRM251_beforeAll.js");

function device(id, log) {
  return {
    async setRegister(regName, value) {
      log.push(["setRegister", id, regName, value]);
    },
    async start() {
      log.push(["start", id]);
    },
  };
}

describe("programTRM251_beforeAll", () => {
  it("спочатку записує програму в усі прилади, потім запускає їх", async () => {
    const program = [{ name: "Програма" }, { Pr: 1, St: 1, tT: 100 }];
    const log = [];

    await programTRM251_beforeAll({
      program,
      devices: [device("A", log), device("B", log)],
    });

    assert.deepEqual(log, [
      ["setRegister", "A", "program", program],
      ["setRegister", "B", "program", program],
      ["start", "A"],
      ["start", "B"],
    ]);
  });

  it("кидає помилку без масиву приладів або без програми", async () => {
    await assert.rejects(
      () => programTRM251_beforeAll({ program: [], devices: null }),
      /devices має бути масивом/
    );
    await assert.rejects(
      () => programTRM251_beforeAll({ devices: [] }),
      /program має бути задана/
    );
  });
});
