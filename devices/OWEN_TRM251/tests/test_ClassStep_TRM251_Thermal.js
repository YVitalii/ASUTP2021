/**
 * Тести ClassStep_TRM251_Thermal.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_Thermal.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ClassStep_TRM251_Thermal = require("../ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");
const parseProgram = require("../parseProgram_RS485.js");
const standardProgram = require("./testProgram.js");

function create(props = {}) {
  return new ClassStep_TRM251_Thermal({
    Pr: 1,
    St: 1,
    tT: 100,
    H: 70,
    Y: 75,
    getState: async () => ({ Pr: 1, St: 1, mode: 1 }),
    ...props,
  });
}

function going(item) {
  item.state._id = "going";
  item.state.startTime = new Date();
  return item;
}

describe("ClassStep_TRM251_Thermal", () => {
  describe("constructor", () => {
    it("бере Pr і St з кроку, а tT, H, Y — з опису термокроку", () => {
      const item = create({ H: "01:10", Y: "01:15" });
      assert.equal(item.regs.tT.id, "tT");
      assert.equal(item.regs.H.type, "timer");
      assert.equal(item.regs.Y.type, "timer");
      assert.equal(item.regs.Pr, undefined);
      assert.equal(item.regs.St, undefined);
      assert.equal(item.goal.Pr, 1);
      assert.equal(item.goal.St, 1);
      assert.equal(item.goal.tT, 100);
      assert.equal(item.goal.H, 70);
      assert.equal(item.goal.Y, 75);
      assert.equal(item.checkPeriod, 5);
      assert.equal(ClassStep_TRM251_Thermal.type, "TRM251stepThermal");
      assert.equal(item.device, null);
      assert.equal(item.state._id, "waiting");
    });

    it("props.device зберігає менеджер приладу і читає його стан", async () => {
      const device = {
        async getCurrentState() {
          return { programN: 1, step: 2, mode: 1 };
        },
      };
      const item = going(
        new ClassStep_TRM251_Thermal({
          Pr: 1,
          St: 1,
          tT: 100,
          H: 10,
          Y: 10,
          device,
        }),
      );
      assert.equal(item.device, device);
      assert.throws(
        () =>
          new ClassStep_TRM251_Thermal({
            Pr: 1,
            St: 1,
            tT: 100,
            H: 10,
            Y: 10,
            device: {},
          }),
        /getCurrentState має бути функцією/,
      );
      assert.equal(await item.testProcess(), true);
      assert.equal(item.state._id, "finished");
    });

    it("getStep повертає новий екземпляр із переданими налаштуваннями", () => {
      const props = {
        Pr: 2,
        St: 3,
        tT: 80,
        H: 10,
        Y: 20,
        getState: async () => ({ Pr: 2, St: 3, mode: 1 }),
      };
      const made = ClassStep_TRM251_Thermal.getStep(props);
      const created = ClassStep_TRM251_Thermal.createStep(props);
      assert.ok(made instanceof ClassStep_TRM251_Thermal);
      assert.ok(created instanceof ClassStep_TRM251_Thermal);
      assert.equal(created.goal.Pr, 2);
      assert.equal(made.goal.Pr, 2);
      assert.equal(made.goal.St, 3);
      assert.equal(made.goal.tT, 80);
      assert.equal(made.goal.H, 10);
      assert.equal(made.goal.Y, 20);
    });

    it("кидає помилку без getState і без готових Pr/St", () => {
      assert.throws(
        () => create({ getState: undefined }),
        /Критична помилка: немає props\.device і props\.getState/,
      );
      assert.throws(() => create({ Pr: undefined }), /already contain Pr and St/);
      assert.throws(() => create({ St: undefined }), /already contain Pr and St/);
    });
  });

  describe("testProcess", () => {
    it("режим 0 зупиняє крок", async () => {
      const item = going(
        create({ getState: async () => ({ Pr: 1, St: 1, mode: 0 }) })
      );
      assert.equal(await item.testProcess(), false);
      assert.equal(item.state._id, "stoped");
      assert.equal(item.state.note.ua, "Зупинено користувачем");
    });

    it("режим 2 — аварія", async () => {
      const item = going(
        create({ getState: async () => ({ Pr: 1, St: 1, mode: 2 }) })
      );
      assert.equal(await item.testProcess(), false);
      assert.equal(item.state._id, "error");
      assert.equal(item.err.ua, "Аварія!");
    });

    it("режими 4..7 — автоналаштування", async () => {
      for (const mode of [4, 5, 6, 7]) {
        const item = going(
          create({ getState: async () => ({ Pr: 1, St: 1, mode }) })
        );
        assert.equal(await item.testProcess(), false);
        assert.equal(item.err.ua, "Йде автоналаштування!");
      }
    });

    it("той самий Pr/St лишає крок у роботі і планує наступне опитування", async () => {
      const item = going(create({ checkPeriod: 2 }));
      const planned = [];
      const original = global.setTimeout;
      global.setTimeout = (fn, ms) => {
        planned.push(ms);
        return 1;
      };
      try {
        assert.equal(await item.testProcess(), false);
      } finally {
        global.setTimeout = original;
      }
      assert.equal(item.state._id, "going");
      assert.deepEqual(planned, [2000]);
    });

    it("читає programN і step зі стану менеджера", async () => {
      const same = going(
        create({
          getState: async () => ({ programN: 1, step: 1, mode: 1 }),
        }),
      );
      const planned = [];
      const original = global.setTimeout;
      global.setTimeout = (fn, ms) => {
        planned.push(ms);
        return 1;
      };
      try {
        assert.equal(await same.testProcess(), false);
      } finally {
        global.setTimeout = original;
      }
      assert.equal(same.state._id, "going");
      assert.deepEqual(planned, [5000]);

      const next = going(
        create({
          getState: async () => ({ programN: 1, step: 2, mode: 1 }),
        }),
      );
      assert.equal(await next.testProcess(), true);
      assert.equal(next.state._id, "finished");
    });

    it("читає Pr, St і mode з поля value", async () => {
      const item = going(
        create({
          getState: async () => ({
            Pr: { value: 1 },
            St: { value: 2 },
            mode: { value: 1 },
          }),
        })
      );
      assert.equal(await item.testProcess(), true);
      assert.equal(item.state._id, "finished");
      assert.equal(item.state.note.ua, "Крок виконано успішно");
    });

    it("режим 3 завершує крок, навіть якщо Pr/St ще збігаються", async () => {
      const item = going(
        create({ getState: async () => ({ Pr: 1, St: 1, mode: 3 }) })
      );
      assert.equal(await item.testProcess(), true);
      assert.equal(item.state._id, "finished");
    });

    it("помилка читання приладу переводить крок у error", async () => {
      const item = going(
        create({
          getState: async () => {
            throw new Error("немає зв'язку");
          },
        })
      );
      assert.equal(await item.testProcess(), false);
      assert.equal(item.state._id, "error");
      assert.match(item.err.ua, /немає зв'язку/);
    });

    it("не чіпає крок, який уже не виконується", async () => {
      const item = create();
      assert.equal(await item.testProcess(), false);
      assert.equal(item.state._id, "waiting");
    });
  });

  describe("стандартна програма", () => {
    it("parseProgram ставить Pr/St і з них збираються кроки", () => {
      const thermal = standardProgram.filter((step) => step.type === "TRM251stepThermal");
      assert.deepEqual(standardProgram[6], {
        type: ClassStep_TRM251_nextProgram.type,
        prgN: 2,
      });
      assert.deepEqual(
        thermal.map((step) => ({
          Pr: step.Pr,
          St: step.St,
          tT: step.tT,
          H: step.H,
          Y: step.Y,
        })),
        [
          { Pr: 1, St: 1, tT: 110, H: 10, Y: 20 },
          { Pr: 1, St: 2, tT: 330, H: 50, Y: 70 },
          { Pr: 1, St: 3, tT: 450, H: 59, Y: 120 },
          { Pr: 1, St: 4, tT: 550, H: 30, Y: 40 },
          { Pr: 1, St: 5, tT: 600, H: 20, Y: 30 },
          { Pr: 2, St: 1, tT: 200, H: 15, Y: 25 },
          { Pr: 2, St: 2, tT: 400, H: 60, Y: 90 },
          { Pr: 2, St: 3, tT: 500, H: 40, Y: 60 },
          { Pr: 2, St: 4, tT: 250, H: 10, Y: 15 },
        ]
      );

      const steps = thermal.map(
        (step) =>
          new ClassStep_TRM251_Thermal({
            ...step,
            getState: async () => ({ Pr: step.Pr, St: step.St, mode: 1 }),
          })
      );
      assert.equal(steps[0].goal.Pr, 1);
      assert.equal(steps[0].goal.St, 1);
      assert.equal(steps[0].goal.tT, 110);
      assert.equal(steps[0].regs.Pr, undefined);
      assert.equal(steps[4].goal.Pr, 1);
      assert.equal(steps[4].goal.St, 5);
      assert.equal(steps[5].goal.Pr, 2);
      assert.equal(steps[5].goal.St, 1);
      assert.equal(steps[8].goal.Pr, 2);
      assert.equal(steps[8].goal.St, 4);
      assert.equal(steps[8].goal.Y, 15);
    });

    it("час ГГ:ХХ уже переведений до конструктора", () => {
      const { program } = parseProgram([
        { name: "Програма" },
        { tT: 100, H: "01:10", Y: "01:15" },
      ]);
      const item = new ClassStep_TRM251_Thermal({
        ...program[1],
        getState: async () => ({ Pr: 1, St: 1, mode: 1 }),
      });
      assert.deepEqual(
        { Pr: item.goal.Pr, St: item.goal.St, tT: item.goal.tT, H: item.goal.H, Y: item.goal.Y },
        { Pr: 1, St: 1, tT: 100, H: 70, Y: 75 }
      );
    });
  });

  describe("start", () => {
    it("beforeAll завершує крок, коли прилад пішов далі", async () => {
      let after = 0;
      const item = create({
        getState: async () => ({ Pr: 2, St: 1, mode: 1 }),
        async afterAll() {
          after += 1;
        },
      });
      assert.equal(await item.start(), 1);
      assert.equal(item.state._id, "finished");
      assert.equal(after, 1);
    });
  });
});
