const ClassLoggerManager = require("../ClassLoggerManager");
const log = require("../../../tools/log");
const ClassTemperatureEmulator = require("../../../devices/ClassTemperatureEmulator.js");
let trp1 = new ClassTemperatureEmulator();
let trp2 = new ClassTemperatureEmulator({ heating: { time: 25 } });
trp1.start();
trp2.start();
let props = {
  ln: "test_createLoggerManager::",
  baseUrl: "/entity/loggerManager",
  baseDir: __dirname,
  period: 1 * 1000,
  regs: [
    {
      id: "T1",
      header: { ua: `Зона №1`, en: `Section 1`, ru: `Зона №1` },
      comment: { ua: ``, en: ``, ru: `` },
      units: { ua: `&deg;C`, en: `&deg;C`, ru: `&deg;C` },
      getValue: async () => {
        return await trp1.getT();
      },
    },

    {
      id: "T2",
      header: { ua: `Зона №2`, en: `Section 2`, ru: `Зона №2` },
      comment: { ua: ``, en: ``, ru: `` },
      units: { ua: `&deg;C`, en: `&deg;C`, ru: `&deg;C` },
      getValue: async () => {
        return await trp2.getT();
      },
    },
  ],
};

let logger = new ClassLoggerManager(props);

let trace = 1,
  ln = `test_createLogger.js::`;

if (trace) {
  log("i", ln, `logger=`);
  console.dir(logger, { depth: 3 });
}

let go = async () => {
  await logger.start("current");
  let archiv = await logger.getLoggerArchiv();
  console.log(archiv);
  archiv = await logger.getPointsArchiv();
  console.log(archiv);
};

setTimeout(() => {
  go();
}, 1000);
setTimeout(() => {
  console.log(ln, "Start new log file.");
  logger.start("2023-05-16");
}, 15 * 1000);
