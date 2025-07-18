const iface = require("../../../conf_iface.js").w2; //interfaces
const log = require("../../../tools/log.js"); // логер
const dummy = require("../../../tools/dummy.js").dummyPromise;
let ln = __filename;

const driver = require("../driver.js");

const props = { iface, devAddr: 16, regName: "" };

// log("i", ln, `driver=`);
// console.dir(driver);

(async () => {
  do {
    let trace = 0,
      ln = `async()::`;
    let res = "";
    for (let i = 1; i < 5; i++) {
      props.regName = `I${i}`;
      try {
        let response = await driver.getRegPromise(props);

        if (trace) {
          log("i", ln, `response=`);
          console.dir(response);
        }
        let t = response[0].value;
        res += `${props.regName}=${t.toFixed(1)}; `;
      } catch (error) {
        res += `${props.regName}=[${error.ua}]; `;
      }
    }
    log("", res);
    await dummy(2000);
  } while (true);
})();
