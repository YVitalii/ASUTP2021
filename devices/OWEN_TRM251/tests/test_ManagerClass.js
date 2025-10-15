//  supervisor   --no-restart-on exit ./tests/test_ManagerClass.js

const ManagerClass = require("../ManagerClass.js");

const iface = require("../../../conf_iface.js").w2; //interfaces
const log = require("../../../tools/log.js"); // логер
const dummy = require("../../../tools/dummy.js").dummyPromise;
let ln = __filename;

let props = {
  iface,
  addr: 1,
  id: "TRM251-1",
  comment: {
    ua: `Терморегулятор печі`,
    en: `Furnace's thermoregulator`,
    ru: `Терморегулятор печи`,
  },
};

let dev = new ManagerClass(props);
// let templReg = {
//   id: "T1",
//   comment: {
//     ua: `Температура вхід 1`,
//     en: `Temperature of input 1`,
//     ru: `Температура вход 1`,
//   },
//   units: units.degC,
//   type: "number",
//   min: -20,
//   max: 1200,
//   readonly: true,
//   obsolescense: 10,
//   driverRegName: "I1",
// };
// dev.addRegister(templReg);

//console.dir(dev);

(async () => {
  let line = "";
  while (true) {
    line = new Date().toTimeString().substring(0, 8) + "-> ";
    // let res2 = await dev.driver.getRegPromise({
    //   iface: dev.iface,
    //   devAddr: 16,
    //   regName: `I${i}`,
    // });
    // console.log("====== res2=");
    // console.dir(res2);

    for (let i = 1; i < 3; i++) {
      let regName = `T${i}`;
      let value = await dev.getRegister(regName);
      let res = await dev.getRegForHtml(regName);
      // console.dir(res);
      line += `${regName}=${value}${res.units.ua} - ${res.note}; `;
    }
    console.log(line);
    await dummy(2000);
  }
})();
