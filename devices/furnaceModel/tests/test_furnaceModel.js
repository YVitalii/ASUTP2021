/**
 * Тести моделі печі Furnace.
 * Запуск: node --test ./devices/furnaceModel/tests/test_furnaceModel.js
 */
const { describe, it } = require("node:test");
const { equal, ok, throws } = require("node:assert");
const Furnace = require("../furnaceModel.js");

const AMBIENT = 20;

function createFurnace(extra = {}) {
  return new Furnace({
    heatersPow: 35,
    heatersWeight: 11,
    furnaceWeight: 100,
    furnaceMaxT: 400,
    furnaceMaxLoss: 20,
    period: 5,
    ...extra,
  });
}

describe("Furnace", () => {
  describe("constructor", () => {
    it("ставить period=5 і currTime=0 за замовчуванням", () => {
      const f = new Furnace();
      equal(f.period, 5);
      equal(f.currTime, 0);
    });

    it("приймає period і параметри маси/потужності", () => {
      const f = createFurnace({ period: 2, heatersPow: 50 });
      equal(f.period, 2);
      equal(f.currTime, 0);
    });
  });

  describe("heat()", () => {
    it("кидає помилку для p < 0 і p > 100", () => {
      const f = createFurnace();
      throws(() => f.heat(-1), /too high/);
      throws(() => f.heat(101), /too high/);
    });

    it("приймає 0, 50 і 100", () => {
      const f = createFurnace();
      f.heat(0);
      f.heat(50);
      f.heat(100);
    });
  });

  describe("getT()", () => {
    it("кожен виклик зсуває currTime на period", () => {
      const f = createFurnace({ period: 5 });
      f.getT();
      equal(f.currTime, 5);
      f.getT();
      equal(f.currTime, 10);
    });

    it("без нагріву температура лишається близько ambient", () => {
      const f = createFurnace({ period: 5 });
      let t = f.getT();
      equal(typeof t, "number");
      ok(Math.abs(t - AMBIENT) < 1);
      for (let i = 0; i < 10; i++) t = f.getT();
      ok(Math.abs(t - AMBIENT) < 2, `T=${t} має лишатися біля ${AMBIENT}`);
    });

    it("при 100% потужності температура зростає", () => {
      const f = createFurnace({ period: 5, heatersPow: 85 });
      f.heat(100);
      const t0 = f.getT();
      let t = t0;
      for (let i = 0; i < 20; i++) t = f.getT();
      ok(t > t0, `після нагріву T=${t} має бути > ${t0}`);
      ok(t > AMBIENT + 10, `T=${t} має відчутно зрости над ambient`);
    });

    it("після вимкнення нагріву зростання сповільнюється / зникає", () => {
      const f = createFurnace({ period: 5, heatersPow: 85 });
      f.heat(100);
      for (let i = 0; i < 15; i++) f.getT();
      const tHot = f.getT();

      f.heat(0);
      const samples = [];
      for (let i = 0; i < 40; i++) samples.push(f.getT());

      const tEnd = samples[samples.length - 1];
      const mid = samples[Math.floor(samples.length / 2)];
      // після вимкнення не продовжує лінійно розганятися як під 100%
      const riseWhileOff = tEnd - tHot;
      const riseWhileOnApprox = tHot - AMBIENT;
      ok(
        riseWhileOff < riseWhileOnApprox,
        `ріст при off (${riseWhileOff.toFixed(1)}) має бути менший за ріст при on (~${riseWhileOnApprox.toFixed(1)})`,
      );
      // з часом охолодження: кінець не вищий за середину «хвоста» набагато
      ok(tEnd <= mid + 5, `T_end=${tEnd.toFixed(1)} vs mid=${mid.toFixed(1)}`);
    });

    it("менший period дає менший крок часу, але той самий API", () => {
      const f = createFurnace({ period: 1, heatersPow: 85 });
      f.heat(100);
      f.getT();
      equal(f.currTime, 1);
      const t = f.getT();
      equal(f.currTime, 2);
      ok(t > AMBIENT);
    });
  });
});
