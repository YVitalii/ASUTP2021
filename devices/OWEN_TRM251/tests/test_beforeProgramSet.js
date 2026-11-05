/**
 * Тести beforeProgramSet.
 * Модуль: TRM251_StepsMan_befProgCreated.js
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_beforeProgramSet.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const beforeProgramSet = require("../TRM251_StepsMan_befProgCreated.js");
const ClassStep_TRM251_Thermal = require("../ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_goToPrSt = require("../ClassStep_TRM251_goToPrSt.js");
const ClassStep_TRM251_ProgLoadToDev = require("../ClassStep_TRM251_ProgLoadToDev.js");
const ClassStep_TRM251_Start = require("../ClassStep_TRM251_Start.js");
const ClassStep_TRM251_Stop = require("../ClassStep_TRM251_Stop.js");

const stepType = ClassStep_TRM251_Thermal.type;
const nextType = ClassStep_TRM251_goToPrSt.type;
const loadType = ClassStep_TRM251_ProgLoadToDev.type;
const startType = ClassStep_TRM251_Start.type;
const stopType = ClassStep_TRM251_Stop.type;

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
    assert.equal(result[1].type, loadType);
    assert.equal(result[1].program[0], header);
    assert.deepEqual(result[2], { type: startType, prN: 1, stN: 1 });
    assert.deepEqual(result.at(-1), { type: stopType });
    assert.notEqual(result[3], source[1]);
  });

  it("переводить ГГ:ХХ у хвилини і ставить Pr/St першому кроку", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { tT: 100, H: "01:10", Y: "01:15" },
    ]);

    assert.deepEqual(result[3], {
      Pr: 1,
      St: 1,
      type: stepType,
      tT: 100,
      H: 70,
      Y: 75,
    });
    assert.equal(result[1].program[1], result[3]);
  });

  it("лишає числові хвилини і рядки, що не є часом", () => {
    const result = beforeProgramSet([
      { name: "Програма" },
      { tT: 250, H: 30, Y: "00:05", type: "taskThermal_TRM251", note: "01" },
    ]);

    assert.deepEqual(result[3], {
      Pr: 1,
      St: 1,
      type: stepType,
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

    assert.equal(result[3].H, 65);
    assert.equal(result[3].Y, 0);
  });

  it("нумерує кроки Pr 1..3 і St 1..5", () => {
    const result = beforeProgramSet(programWithSteps(15));

    assert.deepEqual(
      { Pr: result[3].Pr, St: result[3].St },
      { Pr: 1, St: 1 }
    );
    assert.deepEqual(
      { Pr: result[7].Pr, St: result[7].St },
      { Pr: 1, St: 5 }
    );
    assert.deepEqual(result[8], { type: nextType, prN: 2, stN: 1 });
    assert.deepEqual(
      { Pr: result[9].Pr, St: result[9].St, type: result[9].type },
      { Pr: 2, St: 1, type: stepType }
    );
    assert.deepEqual(
      { Pr: result[13].Pr, St: result[13].St },
      { Pr: 2, St: 5 }
    );
    assert.deepEqual(result[14], { type: nextType, prN: 3, stN: 1 });
    assert.deepEqual(
      { Pr: result[15].Pr, St: result[15].St },
      { Pr: 3, St: 1 }
    );
    assert.deepEqual(
      { Pr: result[19].Pr, St: result[19].St },
      { Pr: 3, St: 5 }
    );
    assert.equal(result[19].H, 1);
    assert.equal(result[19].Y, 2);
    assert.deepEqual(result.at(-1), { type: stopType });
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

    assert.equal(result[3].Pr, 1);
    assert.equal(result[3].St, 1);
    assert.deepEqual(result[8], { type: nextType, prN: 2, stN: 1 });
    assert.equal(result[9].Pr, 2);
    assert.equal(result[9].St, 1);
  });

  it("приймає програму лише із заголовка", () => {
    const header = { name: "Порожня" };
    const result = beforeProgramSet([header]);
    assert.equal(result[0], header);
    assert.deepEqual(result[1], { type: loadType, program: [header] });
    assert.deepEqual(result[2], { type: startType, prN: 1, stN: 1 });
    assert.deepEqual(result[3], { type: stopType });
    assert.equal(result.length, 4);
  });

  it("приймає вміст програми рядком JSON", () => {
    const result = beforeProgramSet(
      JSON.stringify([{ name: "Програма" }, { tT: 100, H: "01:10", Y: "01:15" }])
    );
    assert.deepEqual(result[3], {
      Pr: 1,
      St: 1,
      type: stepType,
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
