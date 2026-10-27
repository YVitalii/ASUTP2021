/**
 * Тести beforeProgramSet.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_beforeProgramSet.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const beforeProgramSet = require("../beforeProgramSet.js");

function programWithSteps(count, step = (i) => ({ tT: i, H: "00:01", Y: "00:02" })) {
  const list = [{ id: "program", name: "Тест" }];
  for (let i = 1; i <= count; i++) {
    list.push(step(i));
  }
  return list;
}

describe("beforeProgramSet", () => {
  it("лишає заголовок без змін і не мутує вихідну програму", () => {
    const header = { id: "program", name: "Відпал", note: "01:10" };
    const source = [header, { tT: 100, H: "01:10", Y: "01:15" }];

    const result = beforeProgramSet(source);

    assert.equal(result[0], header);
    assert.equal(header.note, "01:10");
    assert.equal(source[1].H, "01:10");
    assert.equal(source[1].Pr, undefined);
    assert.notEqual(result[1], source[1]);
  });

  it("переводить ГГ:ХХ у хвилини і ставить Pr/St першому кроку", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { tT: 100, H: "01:10", Y: "01:15" },
    ]);

    assert.deepEqual(result[1], {
      Pr: 1,
      St: 1,
      type: "TRM251stepThermal",
      tT: 100,
      H: 70,
      Y: 75,
    });
  });

  it("лишає числові хвилини і рядки, що не є часом", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { tT: 250, H: 30, Y: "00:05", type: "taskThermal_TRM251", note: "01" },
    ]);

    assert.deepEqual(result[1], {
      Pr: 1,
      St: 1,
      type: "TRM251stepThermal",
      tT: 250,
      H: 30,
      Y: 5,
      note: "01",
    });
  });

  it("приймає пробіли навколо часу і одну цифру в хвилинах", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { H: " 1:5 ", Y: "00:00" },
    ]);

    assert.equal(result[1].H, 65);
    assert.equal(result[1].Y, 0);
  });

  it("нумерує кроки Pr 1..3 і St 1..5", () => {
    const result = beforeProgramSet(programWithSteps(15));

    assert.deepEqual(
      { Pr: result[1].Pr, St: result[1].St },
      { Pr: 1, St: 1 }
    );
    assert.deepEqual(
      { Pr: result[5].Pr, St: result[5].St },
      { Pr: 1, St: 5 }
    );
    assert.deepEqual(result[6], { type: "TRM251stepNextProgram", prgN: 2 });
    assert.deepEqual(
      { Pr: result[7].Pr, St: result[7].St, type: result[7].type },
      { Pr: 2, St: 1, type: "TRM251stepThermal" }
    );
    assert.deepEqual(
      { Pr: result[11].Pr, St: result[11].St },
      { Pr: 2, St: 5 }
    );
    assert.deepEqual(result[12], { type: "TRM251stepNextProgram", prgN: 3 });
    assert.deepEqual(
      { Pr: result[13].Pr, St: result[13].St },
      { Pr: 3, St: 1 }
    );
    assert.deepEqual(
      { Pr: result[17].Pr, St: result[17].St },
      { Pr: 3, St: 5 }
    );
    assert.equal(result[17].H, 1);
    assert.equal(result[17].Y, 2);
  });

  it("перезаписує вже наявні Pr і St за позицією кроку", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { Pr: 9, St: 9, tT: 100 },
      { tT: 110 },
      { tT: 120 },
      { tT: 130 },
      { tT: 140 },
      { Pr: 1, St: 1, tT: 150 },
    ]);

    assert.equal(result[1].Pr, 1);
    assert.equal(result[1].St, 1);
    assert.deepEqual(result[6], { type: "TRM251stepNextProgram", prgN: 2 });
    assert.equal(result[7].Pr, 2);
    assert.equal(result[7].St, 1);
  });

  it("приймає програму лише із заголовка", () => {
    const header = { name: "Порожня" };
    const result = beforeProgramSet([header]);
    assert.deepEqual(result, [header]);
  });

  it("приймає вміст програми рядком JSON", () => {
    const result = beforeProgramSet(
      JSON.stringify([{ name: "Програма" }, { tT: 100, H: "01:10", Y: "01:15" }])
    );
    assert.deepEqual(result[1], {
      Pr: 1,
      St: 1,
      type: "TRM251stepThermal",
      tT: 100,
      H: 70,
      Y: 75,
    });
  });

  it("кидає помилку на порожню програму, не масив і битий JSON", () => {
    assert.throws(
      () => beforeProgramSet([]),
      /непорожнім масивом/
    );
    assert.throws(
      () => beforeProgramSet(null),
      /непорожнім масивом/
    );
    assert.throws(
      () => beforeProgramSet("{"),
      SyntaxError
    );
  });

  it("кидає помилку, якщо кроків більше 15", () => {
    assert.throws(
      () => beforeProgramSet(programWithSteps(16)),
      /не більше 15 кроків/
    );
  });

  it("кидає помилку, якщо крок не об'єкт", () => {
    assert.throws(
      () => beforeProgramSet([{ name: "Програма" }, null]),
      /крок 1 має бути об'єктом/
    );
    assert.throws(
      () => beforeProgramSet([{ name: "Програма" }, [{ tT: 100 }]]),
      /крок 1 має бути об'єктом/
    );
    assert.throws(
      () => beforeProgramSet([{ name: "Програма" }, 100]),
      /крок 1 має бути об'єктом/
    );
  });
});
