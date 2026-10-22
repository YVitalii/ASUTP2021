/**
 * Тести ClassReg_timer.
 * Запуск: node --test ./tests/testClassReg_timer.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassReg_number = require("../controllers/regsController/ClassReg_number.js");
const ClassReg_timer = require("../controllers/regsController/ClassReg_timer.js");

function reg(props) {
  return new ClassReg_timer({ id: "t", ...props });
}

describe("ClassReg_timer", () => {
  it("успадковує ClassReg_number і має тип timer", () => {
    const item = reg({ value: 15 });
    assert.ok(item instanceof ClassReg_number);
    assert.equal(item.type, "timer");
    assert.equal(item.ln, "ClassReg_timer(t)::");
  });

  it("кидає помилку, якщо id не передано", () => {
    assert.throws(
      () => new ClassReg_timer({ value: 1 }),
      /id регістру має бути вказаний/
    );
  });

  describe("межі", () => {
    it("за замовчуванням min = 0 і max = 99 годин", () => {
      const item = reg({ value: 10 });
      assert.equal(item.min, 0);
      assert.equal(item.max, 99 * 60);
      assert.equal(item.value, 10);
    });

    it("зберігає явний 0, null і передані межі", () => {
      const zeros = reg({ min: 0, max: 0, value: 5 });
      const open = reg({ min: null, max: null, value: -5 });
      const custom = reg({ min: 0, max: 90, value: 30 });
      assert.equal(zeros.value, 0);
      assert.equal(open.min, null);
      assert.equal(open.max, null);
      assert.equal(open.value, -5);
      assert.equal(custom.max, 90);
      assert.equal(custom.value, 30);
    });

    it("без value бере min", () => {
      assert.equal(reg({}).value, 0);
      assert.equal(reg({ min: 15, max: 90 }).value, 15);
    });
  });

  describe("setValue", () => {
    it("приймає число хвилин і обрізає до меж", () => {
      assert.equal(reg({ max: 90, value: 120 }).value, 90);
      assert.equal(reg({ min: 10, value: 3 }).value, 10);
    });

    it("приймає рядок ГГ:ХХ і зберігає хвилини", () => {
      assert.equal(reg({ value: "02:15" }).value, 135);
      assert.equal(reg({ value: "00:00" }).value, 0);
      assert.equal(reg({ value: "1:05" }).value, 65);
    });

    it("обрізає ГГ:ХХ до max і повертає хвилини", () => {
      const item = reg({ min: 0, max: 90, value: "02:00" });
      assert.equal(item.value, 90);
      assert.equal(item.setValue("00:30"), 30);
      assert.equal(item.setValue("99:59"), 90);
      assert.equal(item.getValue(), 90);
    });

    it("округляє дробові хвилини до цілого", () => {
      assert.equal(reg({ value: 10.4 }).value, 10);
      assert.equal(reg({ value: 10.5 }).value, 11);
      assert.equal(reg({ max: 90, value: 90.6 }).value, 90);
      assert.equal(reg({ value: "10.6" }).value, 11);
    });

    it("не записує badValue і лишає попереднє значення", () => {
      const item = reg({ value: "01:00" });
      assert.equal(item.setValue("badValue"), 60);
      assert.equal(item.value, 60);
      assert.equal(item.setValue("ab:cd"), 60);
      assert.equal(reg({ value: "badValue" }).value, null);
    });
  });
});
