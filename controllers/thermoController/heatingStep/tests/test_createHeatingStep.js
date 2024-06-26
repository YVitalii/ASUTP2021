const ClassHeatingStep = require("../ClassHeatingStep.js");
const ClassTemperatureEmulator = require("../../../../devices/ClassTemperatureEmulator.js");

let gLn = "test_createQuickHeatingStep.js::";

let trp = new ClassTemperatureEmulator({
  heating: {
    tT: 200,
    time: 120,
  },
});

let step = new ClassHeatingStep({
  tT: trp.heating.tT,
  H: parseInt(trp.heating.time / 60),
  errTmin: -20,
  errTmax: 20,
  header: {
    ua: `Тестовий крок нагрівання`,
    en: `Test step of heating`,
    ru: ``,
  },
  beforeStart: async function () {
    await trp.setRegs({ tT: this.tT, H: parseInt(trp.heating.time / 60) });
    await trp.start();
  },
  getT: async function () {
    return await trp.getT();
  },
  // async function () {
  //     let trace = 1,
  //       ln = gLn + "getT()::";
  //     console.log(ln + this.header.ua + ` this.t=${this.t}`);

  //     //this.t += 5;
  //     let t = await trp.getT();
  //     return t;
  //   },

  wT: -10,
  wave: { period: 1 },
});

module.exports = step;

if (!module.parent) {
  console.log("---------- step= ----------------------");
  console.dir(step);
  //   for (let i = 0; i < 250; i += 10) {
  //     //i += 5;
  //     step.t = i;
  //     step.checkTemperatureRange();
  //   }

  (async () => {
    setTimeout(() => {
      //step.error({ ua: `Капец!`, en: `Yuck!`, ru: `Пипец!` });
      //   step.stop({ ua: `Зупинено!`, en: `Stoped!`, ru: `Остановлено!` });
    }, 5 * 1000);
    await step.start();
    console.log(gLn + "Крок завершено");
    console.dir(step.getState());
  })();

  //console.dir(entity);
  //log(entity.html.compact());
  //log(entity.html.full());
}
