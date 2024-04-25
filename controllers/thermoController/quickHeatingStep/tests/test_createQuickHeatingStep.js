const ClassQuickHeatingStep = require("../ClassQuickHeatingStep.js");
const ClassTemperatureEmulator = require("../../../../devices/ClassTemperatureEmulator.js");
const entity = require("../../../../tests/testEntity/entity");
let gLn = "test_createQuickHeatingStep.js::";
let trace = 1,
  ln = gLn;
let trp = entity.devicesManager.devices["trp08n1"];
if (trace) {
  console.log("i", ln, `entity.devicesManager=`);
  console.dir(entity.devicesManager);
}

let step = new ClassQuickHeatingStep({
  tT: 55,
  header: {
    ua: `Тестовий крок швидкого нагрівання`,
    en: `Test step of quick heating`,
    ru: ``,
  },
  device: trp,
  regs: {
    tT: 100,
    wT: -5,
    errTmin: -10,
    errTmax: 10,
  },
  // beforeStart: async function () {
  //   await trp.setRegs({ tT: this.tT, H: 50 });
  //   await trp.start();
  // },
  // getT: async function () {
  //   return await trp.getT();
  // },
  // async function () {
  //     let trace = 1,
  //       ln = gLn + "getT()::";
  //     console.log(ln + this.header.ua + ` this.t=${this.t}`);

  //     //this.t += 5;
  //     let t = await trp.getT();
  //     return t;
  //   },

  // wT: -10,
  // wave: { period: 1 },
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
    console.log(gLn + "Запуск кроку на виконання");
    await step.start();
    console.log(gLn + "Крок завершено");
    console.dir(step.getState());
  })();

  //console.dir(entity);
  //log(entity.html.compact());
  //log(entity.html.full());
}
