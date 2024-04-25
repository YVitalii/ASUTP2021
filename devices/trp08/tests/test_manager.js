let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const device1 = require("./testCreateTrp.js");
const ln = "test_manager.js::";
let id = 1;
let i = 0;

async function getT() {
  let t = await device1.getT();
  log("", ln + `iteration :${i};t=${t}C`);
  i++;
  setTimeout(() => getT(), 2000);
}

setTimeout(async () => {
  getT();
}, 2000);

async function test() {
  // await device1.getT();
  // await device1.setParams({ tT: 100, o: 5, H: 10, Y: 20, ti: 100, td: 150 });
  // await device1.getParams("tT;o;H;Y;ti;td");
  // await device1.setParams({ tT: 70, o: 10, H: 1, Y: 10, ti: 0, td: 0 });
  await device1.start({
    beforeStart: () => {},
    afterAll: () => {},
    tT: 55,
    t: 0,
    errTmin: 0,
    errTmax: 15,
    regMode: "pid",
    o: 10,
    ti: 0,
    td: 0,
    getT: () => {},
    checkPeriod: 30,
    wT: -5,
  });
  // await device1.getParams("tT;o;H;Y;ti;td");
  setTimeout(() => {
    device1.stop();
  }, 60000);
}

setTimeout(test, 5000);

(async () => {
  //   let ln = "Promise::";
  //   let res = await driver.getRegPromise(iface, id, "tT");
  //   log("i", ln, " --------> get tT");
  //   console.dir(res);
  //   res = await driver.setRegPromise(iface, id, "tT", 170);
  //   log("i", ln, " --------> set tT");
  //   console.dir(res);
})();
