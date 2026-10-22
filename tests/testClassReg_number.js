/**
 * Тести ClassReg_number.
 * Запуск: node --test ./tests/testClassReg_number.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassReg_number = require("../controllers/regsController/ClassReg_number.js");

function reg(props) {
  return new ClassReg_number({ id: "n", ...props });
}

describe("ClassReg_number", () => {
  it("завжди має тип number і зберігає step", () => {
    const item = reg({ step: 0.1, type: "text" });
    assert.equal(item.type, "number");
    assert.equal(item.step, 0.1);
    assert.equal(item.id, "n");
  });

  it("кидає помилку, якщо id не передано", () => {
    assert.throws(
      () => new ClassReg_number({ value: 1 }),
      /id регістру має бути вказаний/
    );
  });

  describe("межі", () => {
    it("min і max за замовчуванням null", () => {
      const item = reg({ value: 1000 });
      assert.equal(item.min, null);
      assert.equal(item.max, null);
      assert.equal(item.value, 1000);
    });

    it("явний null лишає сторону без обмеження", () => {
      const item = reg({ min: null, max: null, value: -3 });
      assert.equal(item.min, null);
      assert.equal(item.max, null);
      assert.equal(item.value, -3);
    });

    it("зберігає нуль і дробові межі", () => {
      const zeros = reg({ min: 0, max: 0, value: 0 });
      const fraction = reg({ min: 0.5, max: 10.5, value: 1 });
      assert.equal(zeros.min, 0);
      assert.equal(zeros.max, 0);
      assert.equal(fraction.min, 0.5);
      assert.equal(fraction.max, 10.5);
      assert.equal(fraction.value, 1);
    });

    it("без value бере min, а якщо min немає — лишає null", () => {
      assert.equal(reg({ min: -5, max: 10 }).value, -5);
      assert.equal(reg({}).value, null);
    });
  });

  describe("setValue", () => {
    it("обрізає значення з конструктора до меж", () => {
      assert.equal(reg({ min: 0, max: 100, value: 200 }).value, 100);
      assert.equal(reg({ min: 0, max: 100, value: -5 }).value, 0);
      assert.equal(reg({ min: 0, max: 0, value: 5 }).value, 0);
    });

    it("не обмежує сторону, де межа null", () => {
      assert.equal(reg({ max: 10, value: -40 }).value, -40);
      assert.equal(reg({ min: 0, value: 50 }).value, 50);
      assert.equal(reg({ max: 10, value: 50 }).value, 10);
      assert.equal(reg({ min: 0, value: -5 }).value, 0);
    });

    it("повертає записане значення", () => {
      const item = reg({ min: -20, max: 0, value: -5 });
      assert.equal(item.getValue(), -5);
      assert.equal(item.setValue(3), 0);
      assert.equal(item.value, 0);
      assert.equal(item.setValue(-100), -20);
    });

    it("зберігає нуль як задане значення", () => {
      const item = reg({ min: -10, max: 10, value: 0 });
      assert.equal(item.value, 0);
      assert.equal(item.setValue(0), 0);
    });
  });
});
