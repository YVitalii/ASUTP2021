// Живий прогін менеджера TRM-251: програма з testProgram.js, старт із Пр2 Крок2.
const iface = require("../../../conf_iface.js").w2;
const dummy = require("../../../tools/dummy.js").dummyPromise;
const { deepEqual, equal, ok } = require("node:assert");
const { after, describe, it } = require("node:test");
const Manager = require("../ManagerClassTRM251.js");
const fullProgram = require("./testProgram.js");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");

const ADDR = 16;

describe("Manager TRM251 на реальному RS485", { concurrency: false }, () => {
  let device;

  after(() => {
    Manager.prototype.getMode = async function () {};
    iface.iterate = () => {};
    if (iface.serial?.isOpen) iface.serial.close();
  });

  it("запускає з програми 2 кроку 2, читає стан 10 разів і зупиняє", async () => {
    Manager.prototype.getMode = async function () {};
    device = new Manager({ iface, addr: ADDR, id: "TRM251" });

    try {
      // Повторна зупинка вже зупиненого приладу не пише регістр. start сам викличе stop, якщо mode не 0.
      await device.stop();
      await dummy(1000);
      device.regs.mode.timestamp = 0;

      const started = await device.start({
        program: fullProgram,
        prN: 2,
        stN: 2,
      });
      equal(started, true);

      const expected = fullProgram
        .slice(1)
        .filter((step) => step.type !== ClassStep_TRM251_nextProgram.type)
        .map((step) => ({ tT: step.tT, H: step.H, Y: step.Y }));
      device.regs.program.timestamp = 0;
      const readBack = await device.getRegister("program");
      const written = readBack
        .slice(1, 1 + expected.length)
        .map((step) => ({ tT: step.tT, H: step.H, Y: step.Y }));
      deepEqual(written, expected);

      const states = [];
      for (let i = 0; i < 10; i++) {
        const state = await device.getCurrentState();
        states.push({
          Alarm: state.Alarm,
          programN: state.programN,
          step: state.step,
          mode: state.mode,
        });
        console.log(
          `#${i + 1} Alarm=${state.Alarm} programN=${state.programN} step=${state.step} mode=${state.mode}`,
        );
        if (i < 9) await dummy(1000);
      }

      equal(states.length, 10);
      for (const state of states) {
        ok(Number.isInteger(state.Alarm));
        ok(Number.isInteger(state.programN));
        ok(Number.isInteger(state.step));
        ok(Number.isInteger(state.mode));
      }
      ok(
        states.some((state) => state.programN === 2 && state.step === 2),
        "серед читань має бути програма 2 крок 2",
      );
    } finally {
      if (device) {
        device.regs.mode.timestamp = 0;
        await device.stop();
      }
    }
  });
});
