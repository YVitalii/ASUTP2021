const Step = require("../ClassThermoStep.js");
const log = require("../../../../../tools/log.js");
let props = {
  title: { ua: `Тестовий крок`, en: `Test step`, ru: `` },
  tT: 300,
  H: 60,
  getT: () => {},
};
let st = new Step(props);
(async () => {
  //await st.start();
  log("w", "Test step finished!!");
})();

log("w", "st=");
console.dir(st);
setTimeout(() => {
  //   st.finish();
  //st.stop();
  //st.error({ ua: `Помилка`, en: `Error`, ru: `` });
}, 10000);
