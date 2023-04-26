// заглушка, що імітує виконання асинхронного коду
const { dummyPromise } = require("../../tools/dummy.js");

// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";

async function mWaiter(params = { counter: 10 }) {
  this.params = params;
  //this.params.counter = 10;
  let promise = Promise.resolve();
  //   promise.then(() => wait(this.params));
  log("i", "mWaiter");
  console.dir(this.params);
  let res = "";
  while (this.params.counter > 0) {
    res = await wait(this.params);
  }
  return Promise.resolve(res);
  //return promise;
}

async function wait(params) {
  params.counter -= 1;
  log("i", "counter=", params.counter);
  //   await ;
  //   if (params.counter < 0) {
  //     return "Ok";
  //   }
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 1000, "Ok");
  });
}

(async () => {
  let res = await mWaiter();
  log("w", "Task finished: ", res);
})();
