// cd ./devices/trp08
// supervisor --no-restart-on exit ./tests/Trp08Driver_test.js

const { describe, test } = require("node:test");
const { equal, ok, throws, rejects, match } = require("assert");

const devAddr = 1; // адреса приладу в мережі rs485

const config = require("../../../config");

// тут змінюємо значення для швидкого тестування
config.emulateRS485 = false;

// створюємо інтерфейс для тестування
const Iface = require("../../../rs485/class_RS485_iface.js");
let portHeader = "COM3";
const dummy = require("../../../tools/dummy.js").dummyPromise;
const iface = new Iface(portHeader, {
  baudRate: 2400,
  timeoutBetweenCalls: 200,
  id: "w2",
  header: { ua: portHeader, en: portHeader, ru: portHeader },
});
if (config.emulateRS485) {
  let Emulator = require("../Trp08EmulatorClass.js");
  let emulator = new Emulator({
    id: "fakeTrp08",
  });
  console.log("=========emulator.write=========");
  console.dir(emulator.write, { depth: 1 });
  iface.addEmulator(devAddr, emulator);
}
console.log(`Opened ${iface.id}`);

// console.dir(iface)

// завантажуємо драйвер
const driver = require("../makeNewDriverFromOld.js");

// тести
describe("TRP08 registers write/read tests", () => {
  test("state", {}, async (t) => {
    let regName = "state";
    // зупиняємо прилад
    let res = await driver.setRegPromise({ iface, devAddr, regName, value: 1 });
    equal(res.regName, regName);
    equal(res.value, 1);
    res = await driver.getRegPromise({ iface, devAddr, regName });
    equal(res[0].value, 7);
    // запускаэмо прилад
    res = await driver.setRegPromise({ iface, devAddr, regName, value: 17 });
    equal(res.value, 17);
    res = await driver.getRegPromise({ iface, devAddr, regName });
    equal(res[0].value, 23);
    // зупиняємо прилад
    res = await driver.setRegPromise({ iface, devAddr, regName, value: 1 });
  });
  test("T", async (t) => {
    let regName = "T";
    let res;
    // console.log("res=");
    // console.dir(res);
    try {
      res = await driver.setRegPromise({
        iface,
        devAddr,
        regName,
        value: 25,
      });
    } catch (error) {
      match(
        error.message,
        /readonly/,
        "Should be Error, because this readonly register",
      );
    }
    res = (await driver.getRegPromise({ iface, devAddr, regName }))[0].value;
    ok(typeof res === "number", "Should be number");
    ok(res >= 0 && res <= 100, "Temperatura should in range 0..100 °C");

    // let value = await driver.getRegPromise({ iface, devAddr, regName }); //[0].value;

    // ok(value >= 0 && value <= 100, "Temperatura should in range 0..100 °C");
  }); // test T

  test("tT", async (t) => {
    let regName = "tT",
      value = 55 + Math.floor(Math.random() * 10);
    let reg = await driver.setRegPromise({
      iface,
      devAddr,
      regName,
      value,
    });
    let res = await driver.getRegPromise({ iface, devAddr, regName });
    // console.dir(res, { depth: 2 });
    equal(res[0].value, value, `Should be ${value}`);
  }); // test tT

  test("timer", async (t) => {
    let regName = "timer";
    let res;
    // console.log("res=");
    // console.dir(res);
    try {
      res = await driver.setRegPromise({
        iface,
        devAddr,
        regName,
        value: 25,
      });
    } catch (error) {
      match(
        error.message,
        /readonly/,
        "Should be Error, because this readonly register",
      );
    }
    res = (await driver.getRegPromise({ iface, devAddr, regName }))[0].value;
    ok(typeof res === "number", "Should be number");
    equal(res, 0, "Timer should be 0 at the beginning");
  }); // test timer
});
