/**
 * Запис програми в живий TRM-251 кроком ClassStep_TRM251_ProgLoadToDev.
 * Запуск: node --test ./devices/OWEN_TRM251/tests/test_ClassStep_TRM251_ProgLoadToDev_rs485.js
 *
 * Список кроків — program_tasksList.js. Перед записом час "ГГ:ХХ" стає хвилинами,
 * інакше setProgram не приймає рядок часу.
 */
const { after, describe, it } = require("node:test");
const { equal } = require("node:assert");
const testDevice = require("./testDevice.js");
const tasksList = require("./program_tasksList.js");
const beforeProgramSet = require("../TRM251_StepsMan_befProgCreated.js");
const ClassStep_TRM251_ProgLoadToDev = require("../ClassStep_TRM251_ProgLoadToDev.js");

const iface = testDevice.iface;
const Manager = testDevice.Manager;

describe(
  "ClassStep_TRM251_ProgLoadToDev на реальному RS485",
  { concurrency: false },
  () => {
    let device;

    after(() => {
      Manager.prototype.getMode = async function () {};
      iface.iterate = () => {};
      if (iface.serial && iface.serial.isOpen) iface.serial.close();
    });

    it(
      "записує програму з program_tasksList у прилад і звіряє її",
      { timeout: 120000 },
      async () => {
        device = testDevice();
        const program = beforeProgramSet(tasksList);
        console.dir(program, { depth: null });
        const step = new ClassStep_TRM251_ProgLoadToDev({ device, program });

        try {
          device.regs.mode.timestamp = 0;
          await device.stop();
          await step.start();
          device.regs.program.timestamp = 0;
          const readProgram = await device.getRegister("program");
          console.dir(readProgram, { depth: null });
          equal(
            step.state._id,
            "finished",
            step.err && step.err.ua ? step.err.ua : step.state._id,
          );
        } finally {
          if (device) {
            device.regs.mode.timestamp = 0;
            await device.stop();
          }
        }
      },
    );
  },
);
