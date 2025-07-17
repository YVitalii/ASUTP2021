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
    let res = "";
    for (let i = 1; i < 3; i++) {
      props.regName = `T${i}`;
      let t = await driver.getRegPromise(props);
      res += `${props.regName}=${t.toFixed(1)}; `;
    }
    log("", res);
    await dummy(2000);
  } while (true);
})();
