const log = require("../../../../../tools/log.js");
let trace = 1,
  ln = "testHeating()::";
const step = require("./config");
const write = require("fs").writeFileSync;
const pug = require("pug");
const mainPath = "E:/node/ASUTP2021";

let path = mainPath + "/public/tests/heatingStepTest.html";
(async () => {
  let html = step.getHTML("pr_st_2");
  html = pug.renderFile(mainPath + "/views/main.pug", {
    pageTitle: "Тестування кроку Нагрівання",
    body: html,
  });
  write(path, html);

  log("w", "file writed!");
  // console.dir(step.getHTML());
  // log("w", "----------- завершення процесу по перевищенню часу  ----------");
  // dev.heating.tT = props.taskT;
  // dev.heating.time = (props.H + props.errH) * 60 * 2 + 10;
  // await dev.start();
  // await step.start();
  // log("i", "CreateHeatingStep()::Finished!");
})();

// if (trace) {
//   log("i", ln, `step=`);
//   console.dir(step);
// }
