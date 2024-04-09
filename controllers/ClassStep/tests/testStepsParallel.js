const steps = require("./testArrayOfSteps.js");
const ClassStepsParallel = require("../ClassStepsParallel.js");

const log = require("../../../tools/log");
let trace = 0,
  ln = __filename + "::";

let sSteps = new ClassStepsParallel({
  tasks: steps,
  header: {
    ua: `testStepsParallel`,
    en: `testStepsParallel`,
    ru: `testStepsParallel`,
  },
});

if (trace) {
  log("i", ln, `sSteps=`);
  console.dir(sSteps);
}

(async () => {
  try {
    await sSteps.start();
  } catch (error) {
    console.dir(error);
  }
})();

function getState() {
  let state = sSteps.getState();
  //console.dir(state);
  let msg = `${state.header.ua}._id=${state._id};`;
  for (let i = 0; i < state.tasks.length; i++) {
    msg += ";" + `${state.tasks[i].header.ua}= ${state.tasks[i]._id}; `;
  }
  console.log(msg);
  if (state._id === "going" || state._id === "waiting") {
    setTimeout(() => {
      getState();
    }, 2000);
  }
}

getState();

// setTimeout(() => {
//   sSteps.stop();
// }, 15000);

// setTimeout(async () => {
//   try {
//     await sSteps.error({
//       ua: `Manual error!`,
//       en: `Manual error!`,
//       ru: `Manual error!`,
//     });
//   } catch (error) {}
// }, 10000);
