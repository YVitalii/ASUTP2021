const iface = require("../../../conf_iface.js").w4;
const dummy = require("../../../tools/dummy.js").dummyPromise;
const log = require("../../../tools/log.js"); // логер
const gLn = __filename + "::";
let id = 2;
const driver = require("../driver.js");

async function readReg(regName) {
  let ln = gLn + `readReg(${regName})::`;
  return new Promise(function (resolve, reject) {
    driver.getReg(iface, id, regName, (err, data) => {
      if (err) {
        log("e", ln, `err=`);
        console.dir(err);
      }
      log(ln, data[0].regName, "=", data[0].value);
      resolve(1);
    });
  });
}

let regsArray = ["TBlock", "Kn"];
let test = async () => {
  for (let index = 0; index < regsArray.length; index++) {
    const element = regsArray[index];
    await readReg(element);
  }
  await dummy(2000);
  test();
  // driver.getReg(iface, id, "Kc", (err, data) => {
  //   log("---> in getReg \n", data);
  // });
  // driver.getReg(iface, id, "EnableSamplimg", (err, data) => {
  //     log("---> in setReg \n", data);
  // });
  // driver.setReg(iface, id, "EnableSamplimg", 0, (err, data) => {
  //     log("---> in setReg \n", data);
  // });
  // driver.setReg(iface, id, "ReinitCalc", 0, (err, data) => {
  //     log("---> in setReg \n", data);
  // });
  // driver.getReg(iface, id, "ReinitCalc", (err, data) => {
  //     log("---> in setReg \n", data);
  // });
};

setTimeout(test, 3000);
