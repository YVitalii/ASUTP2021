// программа для тестування драйвера OWEN TRM251 через реальний інтерфейс RS485

const iface = require("../../../conf_iface.js").w2; //interfaces
const log = require("../../../tools/log.js"); // логер
const dummy = require("../../../tools/dummy.js").dummyPromise;
const { basename } = require("node:path");
let gLn = basename(__filename);
const driver = require("../driver.js");
const testProgram = require("./testProgram");

const {
  match,
  equal,
  ok,
  throws,
  notEqual,
  strictEqual,
} = require("node:assert");
const { describe, it } = require("node:test");

// console.dir(driver);

const props = { iface, devAddr: 1, regName: "" };

describe("Read registers of OWEN TRM251 device:", () => {
  it("Read temperature from I1", async () => {
    let res = "";

    props.regName = "I1";
    res = await driver.getRegPromise(props);
    let t = res[0].value;
    strictEqual(
      typeof t,
      "number",
      `Temperature should be a number but:  ${t}`,
    );
  }); // it("Read temperature from I1")
  it.skip("Read temperature from I2", async () => {
    props.regName = "I2";
    let res;
    try {
      res = await driver.getRegPromise(props);
      // якщо датчик підключено до входу I2, то повертається число
      let t = res[0].value;
      strictEqual(
        typeof t,
        "number",
        `Temperature should be a number but:  ${t}`,
      );
    } catch (error) {
      console.dir(error, { depth: 2 });
      match(error.ua, /Обрив/, "Message should contain word 'Обрив'");
    }
  }); // it("Read temperature from I2")
  it.skip("Testing read 'Mode' → set Start/stop", async () => {
    props.regName = "mode";
    let beforeMode = (await driver.getRegPromise(props))[0].value;
    strictEqual(
      typeof beforeMode,
      "number",
      `Mode should be a number but:  ${beforeMode}`,
    );
    ok(
      beforeMode >= 0 && beforeMode <= 7,
      `Mode should be in range 0..7 but: ${beforeMode}`,
    );
    if (beforeMode == 0) {
      props.value = 1;
      // console.log(`mode=${beforeMode} → Starting 1`);
    } else {
      props.value = 0;
      // console.log(`mode=${beforeMode} → Stoping 0`);
    }
    props.regName = "startStop";
    res = await driver.setRegPromise(props);
    // console.log("--->res=");
    // console.dir(res, { depth: 2 });
    let startStop = res.value;
    strictEqual(
      typeof startStop,
      "number",
      `startStop should be a number but:  ${startStop}`,
    );
    equal(
      startStop,
      props.value,
      `startStop should be ${props.value} but: ${startStop}`,
    );
    if (beforeMode == 0) {
      props.value = 0;
      res = await driver.setRegPromise(props);
    }
  }); // it("Testing read 'Mode' → set Start/stop")
  // it ("Read taskTemperature from tT", async () => {
  //   props.regName = "tT";
  //   let res = await driver.getRegPromise(props);
  //   let tT = res[0].value;
  // }) // it ("Read taskTemperature from tT")
  it.skip("Write program", async () => {
    props.regName = "program";
    props.value = testProgram;
    let res = await driver.setRegPromise(props);
    console.log("program=");
    console.dir(res, { depth: 3 });
  });
  it("Read 'program'", async () => {
    props.regName = "program";
    let res = await driver.getRegPromise(props);
    console.log("program=");
    console.dir(res, { depth: 3 });
    // let mode = res[0].value;
    // console.dir(res, { depth: 2 });
  }); // it("Read 'mode' register")
}); // describe

// const props = { iface, devAddr: 16, regName: "" };
// log("i", ln, `driver=`);
// console.dir(driver);

//   async () => {
//     do {
//       let trace = 0,
//         ln = gLn + `::async()::`;
//       let res = "",
//         response;
//       let i = 1;
//       for (let i = 1; i < 3; i++) {
//         props.regName = `I${i}`;
//         try {
//           response = await driver.getRegPromise(props);
//           let t = response[0].value;
//           res += `${props.regName}=${t.toFixed(1)}; `;
//         } catch (error) {
//           res += `${props.regName}=[${error.ua}]; `;
//           // console.log("Error", error);
//         }

//         if (trace) {
//           log("i", ln, `response=`);
//           console.dir(response, { depth: 3 });
//         }
//         // log("", `trace=${trace}`);
//         await dummy(2000);
//       }
//       log("", ln, res);
//     } while (true);
//   },
// )();
