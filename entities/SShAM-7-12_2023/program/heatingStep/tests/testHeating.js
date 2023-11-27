const log = require("../../../../../tools/log.js");
let trace = 1,
  ln = "testHeating()::";
const step = require("./config");

(async () => {
  setTimeout(async () => {
    await step.dev.start();
    await step.start();
    log("w", "----------- нормальне завершення процесу ----------");
  }, 1000);

  // log("w", "----------- завершення процесу по перевищенню часу  ----------");
  // dev.heating.tT = props.taskT;
  // dev.heating.time = (props.H + props.errH) * 60 * 2 + 10;
  // await dev.start();
  // await step.start();
  // log("i", "CreateHeatingStep()::Finished!");
})();

if (trace) {
  log("i", ln, `step=`);
  console.dir(step);
}
