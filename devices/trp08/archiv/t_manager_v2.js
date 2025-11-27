let iface = require("../../../conf_iface.js").w2;

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
// let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
const device1 = require("./t_createTrp_v2.js");
const ln = __filename + "::";
let id = 1,
  trace = 1;
let i = 0;

async function getT() {
  let t = await device1.getT();
  log("", ln + `iteration :${i}; t= ${t} C`);
  i++;
  setTimeout(() => getT(), 2000);
}

// async function getState() {
//   let t = await device1.getState();
//   if (trace) {
//     log("i", ln, `state=`);
//     console.dir(t);
//   }
//   //log("", ln + `iteration :${i}; state= ${t}`);
//   i++;
//   //setTimeout(() => getState(), 2000);
// }

async function test() {
  // await device1.getT();
  await device1.start({
    tT: 70,
    regMode: "pid",
    o: 5,
    H: 10,
    Y: 20,
    ti: 10,
    td: 15,
  });
  let params = await device1.getParams("state;tT;o;H;Y;ti;td");
  console.log("device1.getParams()=");
  console.dir(params);
  // await device1.setParams({ tT: 70, o: 10, H: 1, Y: 10, ti: 0, td: 0 });

  // await device1.getParams("tT;o;H;Y;ti;td");
  setTimeout(() => {
    device1.stop();
  }, 60000);
}

setTimeout(() => {
  getT();
  //getState();
  test();
}, 5000);
