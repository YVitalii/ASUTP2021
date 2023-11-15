let dummy = require("./../../../../tools/dummy");
let log = require("./../../../../tools/log");
let gLn = "<" + __filename.replace(__dirname, "").slice(1) + ">::";
/** Крок - асинхронна функція що виконує задачу, повертає promise
 * @param {Object} program - посилання на програму
 */
async function step(entity) {
  let trace = 1,
    ln = `step[Початок]`;
  let request = {
    manualCheck: [
      {
        ua: `Кришка печі закрита`,
        en: `Cover of furnace closed `,
        ru: ``,
      },
      {
        ua: `Затискачі кришки встановлені`,
        en: `The clamps of cover enabled`,
        ru: ``,
      },
      {
        ua: `Водяне охолодження ввімкнене`,
        en: `Water cooling enabled`,
        ru: ``,
      },
    ],
  };
  if (entity.program.task.Kn != 0) {
    let r = request.manualCheck;
    r.push({
      ua: `Утилізатор ввімкнено, нагрівання запущено`,
      en: ``,
      ru: ``,
    });
    r.push({
      ua: ` Азот є  `,
      en: ``,
      ru: ``,
    });
    r.push({
      ua: ` Аміак є  `,
      en: ``,
      ru: ``,
    });
  }
  if (entity.program.task.Kс != 0) {
    let r = request.manualCheck;
    r.push({
      ua: `Вуглекислота є`,
      en: ``,
      ru: ``,
    });
  }
  if (trace) {
    log("i", ln, `request=`);
    console.dir(request);
  }
  await dummy(1, true);
  trace ? log("i", ln, `Started`) : null;
}
