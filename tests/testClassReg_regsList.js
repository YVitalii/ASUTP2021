/**
 * Тести ClassReg_regsList.
 * Запуск: node --test ./tests/testClassReg_regsList.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassRegister = require("../controllers/regsController/ClassRegister.js");
const ClassReg_regsList = require("../controllers/regsController/ClassReg_regsList.js");
const ClassReg_select = require("../controllers/regsController/ClassReg_select.js");

function child(id) {
  return new ClassRegister({ id, type: "text" });
}

describe("ClassReg_regsList", () => {
  it("має тип regsList і власний префікс лога", () => {
    const item = new ClassReg_regsList({ id: "pos" });
    assert.equal(item.type, "regsList");
    assert.equal(item.ln, "ClassReg_regsList(pos)::");
    assert.deepEqual(item.regs, {});
  });

  it("зберігає переданий ln", () => {
    const item = new ClassReg_regsList({ id: "pos", ln: "tasksDescription::" });
    assert.equal(item.ln, "tasksDescription::");
  });

  it("не змінює переданий props", () => {
    const name = child("name");
    const props = { id: "description", type: "select", regs: { name } };
    const item = new ClassReg_regsList(props);
    assert.equal(props.type, "select");
    assert.equal(item.type, "regsList");
    assert.equal(item.regs.name, name);
    item.regs.note = child("note");
    assert.equal(props.regs.note, undefined);
  });

  it("select лишає свій тип після списку", () => {
    const props = { id: "regMode", value: "pid", regs: {} };
    const item = new ClassReg_select(props);
    assert.equal(item.type, "select");
    assert.equal(props.type, "select");
    assert.equal(item.ln, "ClassReg_select(regMode)::");
  });
});
