const ClassDummyStep = require("../ClassDummyStep.js");

let step1 = new ClassDummyStep({
  header: { ua: `Крок1`, en: ``, ru: `` },
  delay: 5,
  randomize: true,
});
let step2 = new ClassDummyStep({
  header: { ua: `Крок2`, en: ``, ru: `` },
  delay: 10,
  randomize: false,
});

console.dir(step1);
(async () => {
  await step1.start();
  setTimeout(() => {
    step2.stop();
  }, 2000);
  await step2.start();
  setTimeout(() => {
    step2.finish();
  }, 2000);

  await step2.start();

  console.log("Steps finished!");
})();
