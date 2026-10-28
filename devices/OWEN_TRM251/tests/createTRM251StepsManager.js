/**
 * Готовий Class_StepsManager для тестів комплекту TRM-251.
 * Реєструє всі ClassStep_TRM251_*, збирає програму з program_tasksList
 * через beforeProgramSet і віддає крокам один TRM251_emulator.
 */
const Class_StepsManager = require("../../../processes/processManager/Class_StepsManager.js");
const beforeProgramSet = require("../beforeProgramSet.js");
const tasksList = require("./program_tasksList.js");
const ClassStep_TRM251_Thermal = require("../ClassStep_TRM251_Thermal.js");
const ClassStep_TRM251_nextProgram = require("../ClassStep_TRM251_nextProgram.js");
const TRM251_emulator = require("./TRM251_emulator.js");

const stepClasses = [ClassStep_TRM251_Thermal, ClassStep_TRM251_nextProgram];

function createTRM251StepsManager() {
  const device = new TRM251_emulator();

  const steps = new Class_StepsManager({
    id: "TRM251",
    beforeProgramCreated({ program }) {
      const prepared = beforeProgramSet(program);
      return prepared.map((item, index) => {
        if (index === 0) {
          // Заголовок лишається назвою програми, а не кроком description.
          const header = { ...item, name: item.description };
          delete header.id;
          delete header.type;
          return header;
        }
        return { ...item, device, maxT: 1200 };
      });
    },
  });

  for (const Step of stepClasses) {
    steps.addStepType(Step.type, Step);
  }

  const res = steps.createProgram(tasksList);
  if (res.err) throw new Error(res.err.ua);
  steps.device = device;
  steps.start = async function (from = 0) {
    await device.start({ prN: 1, stN: 1 });
    return steps.program.start(from);
  };
  return steps;
}

module.exports = createTRM251StepsManager;
