// cd ./devices/classDeviceGeneral
// supervisor --no-restart-on exit --w '.' ./tests/ClassDriver_Fake_Test.js
const assert = require("assert");
const test = require("node:test");
const clone = require("clone");
const makeFake = require("../makeFakeDriver.js");
// let device = require("../../trp08/makeNewDriverFromOld.js");

// ------------ виготовляємо емулятор приладу -------------------
const ClassDriverGeneral = require("../ClassDriverGeneral.js");
let device = new ClassDriverGeneral({
  id: "testDevice",
});
// --------- додаємо тестовий регістр tT ---------------
device.addRegister({
  id: "tT",
  addr: 0x0100,
  title: "Цільова температура",
  header: {
    ua: `Цільова температура`,
    en: `Goal temperature`,
    ru: ``,
  },
  units: { ua: `°C`, en: `°C`, ru: `°C` },
  type: "integer",
  _get: function () {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1,
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = this.title;
    let data = fromBCD(buf);
    let err = null;
    if (!data) {
      err =
        "_get: Не могу преобразовать буфер:[" +
        buf.toString("hex") +
        "] в число";
    }
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let val = toBCD(data);
    let err = null;
    if (val === null) {
      err = ln + "Не могу преобразовать в BCD:" + data;
    }
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: val,
      },
      err: err,
    };
  },
  set_: function (buf) {
    return this.get_(buf);
  },
}); ///regs.set("tT"

// емулятор iface
let iface = {
  id: "fake iFace",
  send: () => {},
  isOpen: () => {
    return true;
  },
};

const gLn = "./tests/ClassDriver_Fake_Test.js::";

// dev.getRegsInfo();
// перетворюємо драйвер в фейк-драйвер
function newDevice(trace = 0) {
  let ln = gLn + `newDevice()::`;
  let newDev = clone(device);
  makeFake(newDev);
  if (trace) {
    console.log("i", ln, `newDev=`);
    console.dir(newDev);
  }
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
    // console.log("data=");
    // console.dir(data);
    assert.equal(data.value, 200, "Must be tT=200");
    assert.equal(err, null, "Error shoud be null");
    done();
  });
});

test("Перевірка коректної роботи функції set_()", (err, done) => {
  let dev = newDevice();
  let f = (val) => {
    return val + 50;
  };
  dev.regs.get("tT").set_ = f;
  dev.setReg(0, 0, "tT", 200, (err, data) => {
    // console.log("data=");
    // console.dir(data);
    assert.equal(data.value, f(200), "Must be tT=200+50=250");
    assert.equal(err, null, "Error shoud be null");
    done();
  });
});

test("Перевірка не коректного запису регістру setReg()", (err, done) => {
  let dev = newDevice();
  dev.setReg(0, 0, "badRegName", 200, (err, data) => {
    // console.log("data=");
    // console.dir(data);
    // console.log("err=");
    // console.dir(err);
    assert.equal(data, null, "Must be data=null");
    assert.match(err.message, /regName/, "Error shoud has 'regName'");
    done();
  });
});

test("Перевірка коректного читання регістру getReg", (err, done) => {
  let dev = newDevice(0);
  let f = (val = 0) => {
    return val + 50;
  };
  dev.regs.get("tT").get_ = f;
  dev.setReg(0, 0, "tT", 200, (err, data) => {
    // console.log("setReg::data=");
    // console.dir(data);
    dev.getReg(0, 0, "tT", (err, data) => {
      assert.equal(
        data.value,
        f(200),
        "Must be tT=200+50=250, but we have" + JSON.stringify(data)
      );
      assert.equal(err, null, "Error shoud be null");
      done();
    });
  });
});

test("Перевірка getRegPromise('tT') / setRegPromise", async (t) => {
  let dev = newDevice(0);
  let v = await dev.getRegPromise({ iface, devAddr: 1, regName: "tT" });
  assert.equal(v.value, null);
  v = await dev.setRegPromise({ iface, devAddr: 1, regName: "tT", value: 200 });
  assert.equal(v.value, 200, "after setRegPromise(tT=200) must be tT=200");
  v = await dev.getRegPromise({ iface, devAddr: 1, regName: "tT" });
  assert.equal(
    v.value,
    200,
    "after setRegPromise(tT=200) getPromiseReg(tT) must return tT=200"
  );
});
// return Promise.resolve(1);
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
