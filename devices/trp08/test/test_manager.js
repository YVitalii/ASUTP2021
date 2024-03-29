let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const Manager = require("../manager.js");

let id = 1;

async function test() {
  let device1 = new Manager(iface, id, { addT: 5 });

  setInterval(async () => {
    await device1.getT();
  }, 2000);
  // await device1.getT();
  // await device1.setParams({ tT: 100, o: 5, H: 10, Y: 20, ti: 100, td: 150 });
  // await device1.getParams("tT;o;H;Y;ti;td");
  // await device1.setParams({ tT: 70, o: 10, H: 1, Y: 10, ti: 0, td: 0 });
  // await device1.start();
  // await device1.getParams("tT;o;H;Y;ti;td");
  setTimeout(() => {
    device1.stop();
  }, 30000);
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
