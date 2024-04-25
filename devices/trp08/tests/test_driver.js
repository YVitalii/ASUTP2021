// 2024-03-29 Перевірена, працююча версія
const dummy = require("../../../tools/dummy.js").dummyPromise;
let iface = require("../../../conf_iface.js").w2;
// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

let id = 1;
const driver = require("../driver.js");

function logger(data) {
  data = Array.isArray(data) ? data[0] : data;
  let type =
    data.req.FC == 3
      ? "get"
      : data.req.FC == 6
      ? "set"
      : data.req.FC == 10
      ? " FC10"
      : "???";
  log("i", `---> in ${type}Reg ::  ${data.regName}=${data.value}`);
}

function test() {
  driver.getReg(iface, id, "state", (err, data) => {
    // console.dir(data);
    logger(data);
  });
  driver.setReg(iface, id, "state", 17, (err, data) => {
    // console.dir(data);
    logger(data);
  });

  driver.setReg(iface, id, "state", 1, (err, data) => {
    logger(data);
  });
} //function test()

async function testPromise() {
  let ln = "testPromise()::";
  let res;

  log("i", ln, " --------> get tT");
  res = await driver.getRegPromise({ iface, id, regName: "tT" });
  log("i", ln, " -------> get tT - finished");
  console.dir(res);

  log("i", ln, " --------> set tT");
  if (res == undefined) {
    res = [{ value: 10 }];
  }
  res = await driver.setRegPromise({
    iface,
    id,
    regName: "tT",
    value: res[0].value ? res[0].value + 1 : 50,
  });
  log("i", ln, " --------> set tT -finished");
  console.dir(res);
} //async function testPromise

// setTimeout(() => {
//   test();
// }, 3000);

setTimeout(() => {
  testPromise();
}, 6000);
