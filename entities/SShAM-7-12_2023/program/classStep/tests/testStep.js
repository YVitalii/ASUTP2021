const Step = require("../ClassStep");
const log = require("../../../../../tools/log.js");
let st = new Step({ title: { ua: `Тестовий крок`, en: `Test step`, ru: `` } });
(async () => {
  await st.start();
  log("w", "Test step finished!!");
})();

setTimeout(() => {
  //   st.finish();
  //st.stop();
  st.error({ ua: `Помилка`, en: `Error`, ru: `` });
}, 10000);
