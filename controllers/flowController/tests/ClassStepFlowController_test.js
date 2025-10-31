// cd ./controllers/flowController/tests
// supervisor --no-restart-on exit ClassStepFlowController_test.js

const { headers, dirtyness } = require("happy-dom/lib/PropertySymbol.js");
const ClassStepFlowController = require("../ClassStepFlowController");
const assert = require("assert");
let trace = 1,
  ln = `${__filename}::`;
let device = fakeDevice_FlowRegulator;

let props = {
  id: "st1-1",
  checkTime: 2 * 1000, //2 сек
  header: { ua: `N2`, en: `N2`, ru: `N2` },
  comment: {
    ua: `Регулятор потоку N2`,
    en: `N2 flow regulator`,
    ru: `N2 регулятор потока`,
  },
  ln: `Регулятор потоку N2`,
};

let step = new ClassStepFlowController(props);

console.log("i", ln, `step=`);
console.dir(step);
