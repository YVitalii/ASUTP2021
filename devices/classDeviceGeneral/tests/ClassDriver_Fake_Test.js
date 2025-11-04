// cd ./devices/classDeviceGeneral
// supervisor --no-restart-on exit --w '.' ./tests/ClassDriver_Fake_Test.js
let degrees = { ua: `°C`, en: `°C`, ru: `°C` };
const makeFake = require("../ClassDriver_Fake");
let device = require("../../trp08/driver");
const assert = require("assert");
const test = require("node:test");
const clone = require("clone");

// dev.getRegsInfo();
// перетворюємо драйвер в фейк-драйвер
function newDevice() {
  let newDev = clone(device);
  makeFake(newDev);
  return newDev;
}
//
test("Перевірка відразу після емулятора", (err, done) => {
  let dev = newDevice();
  dev.getReg(0, 0, "tT", (err, data) => {
    assert.equal(data.value, null, "Очікувалось значення value=null");
    assert.equal(data.regName, "tT", "Очікувалось data.regName = 'tT'");
    assert.equal(err, null, "Error shoud be null");
    assert.equal(
      dev.regs.get("tT").set_(150),
      150,
      "set_(150) повинна повертати своє значення"
    );
    assert.equal(
      dev.regs.get("tT").get_(),
      150,
      "get_() повиннен повертати значення регістру"
    );
    assert.equal(dev.setOffline(true), dev.offline, "setOffline=true");
    assert.equal(dev.setOffline(false), dev.offline, "setOffline=false");
    done();
  });
});

test("Перевірка коректного запису регістру setReg", (err, done) => {
  let dev = newDevice();
  dev.setReg(0, 0, "tT", 200, (err, data) => {
    console.log("data=");
    console.dir(data);
    assert.equal(data.value, 200, "Must be tT=200");
    assert.equal(err, null, "Error shoud be null");
    done();
  });
});

test("Перевірка не коректного запису регістру setReg()", (err, done) => {
  let dev = newDevice();
  dev.setReg(0, 0, "badRegName", 200, (err, data) => {
    console.log("data=");
    console.dir(data);
    console.log("err=");
    console.dir(err);
    assert.equal(data, null, "Must be data=null");
    assert.match(err.message, /regName/, "Error shoud has 'regName'");
    done();
  });
});

// let reg = dev.regs.get("tT");
// reg.get_ = function (val) {
//   // console.log("this=");
//   // console.dir(this);
//   return this.value;
// };
// reg.set_(150);

// console.log(`----- dev.regs.get('tT').value= ${reg.get_()} -------`);
// console.dir(dev.regs.get("tT"));
// let props = {
//   id: "fakeTRP08",
//   header: { ua: `fakeTRP08`, en: `fakeTRP08`, ru: `fakeTRP08` },
//   comment: { ua: `for tests`, en: `for tests`, ru: `for tests` },
// };
// props.ln = props.id + "::";
// let dev = new FakeDriver(props);

// dev.addRegister({
//   id: "tT",
//   header: { ua: `tT`, en: `tT`, ru: `tT` },
//   comment: {
//     ua: `Задана температура`,
//     en: `Задана температура`,
//     ru: `Задана температура`,
//   },
//   addr: 1,
//   units: degrees,
//   note: "task temperature",
//   type: "integer",
// });

// dev.addRegister({
//   id: "T",
//   header: { ua: `T`, en: `T`, ru: `T` },
//   comment: {
//     ua: `Поточна температура`,
//     en: `Поточна температура`,
//     ru: `Поточна температура`,
//   },
//   addr: 1,
//   units: degrees,
//   note: "Current temperature",
//   type: "integer",
// });
// console.log("----- fake  driver -------");
// console.dir(dev);
