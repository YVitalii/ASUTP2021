const ClassDummyStep = require("../ClassDummyStep.js");

const log = require("../../../tools/log.js");
let trace = 0,
  ln = __filename + "::";

let steps = [];

for (let i = 0; i < 5; i++) {
  steps.push(
    new ClassDummyStep({
      id: "st_" + i,
      delay: i + 3,
    })
  );
}
if (trace) {
  log("i", ln, `steps=`);
  console.dir(steps);
}

module.exports = steps;
