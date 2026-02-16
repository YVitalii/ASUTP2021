// cd ./rs485
// supervisor --no-restart-on exit ./tests/class_RS485_iface_test.js

const { equal, ok } = require("assert");
const { test, describe } = require("node:test");

// щоб не ходити при тестуванні до config.js змінюємо значення тут
const config = require("../../config.js");
config.emulateRS485 = 0;

let iface = require("../../conf_iface.js").w2;

const parseBuf = require("../../tools/parseBuf.js");
const GeneralRS485deviceEmulatorClass = require("../GeneralRS485deviceEmulatorClass.js");

// 2026-02-16 в залежності від змінної config.emulateRS485
// для тестування використовуються або емулятор приладу (emulateRS485=1)  або ТРП-08:
// Налаштування приладів повинні бути:
// - адреса в мережі rs485 : 1, 2400 bod,
// - регістри:
//      0x0001 -  поточна температура
//      0х0100 - задана температура

const dev = new GeneralRS485deviceEmulatorClass({ id: "fakeDevice" });

dev.counter = 0;
// регістр для емулятора - поточна температура
dev.addReg({
  addr: 0x01,
  value: 0,
  id: "T",
  note: "current temperature",
  setR: function (val) {
    this.parent.counter += 1;
    if (val == 6) {
      throw new Error("Unsupported value == 6.");
    }
    this._value = val;
    return this.value;
  },
  getR: function () {
    this.parent.counter += 1;
    return this.parent.counter;
  },
});

// регістр для емулятора - цільова температура
dev.addReg({
  addr: 0x0100,
  value: 0,
  id: "tT",
  note: "task temperature",
  setR: function (val) {
    // console.log("this.id=" + this.id);
    this._value = val;
    return val;
  },
});

if (iface.serial.name == "SerialPortEmulator") {
  console.log(`-------- Emulator for device [${dev.id}] was added -------`);
  iface.serial.addDevice(0x1, dev);
}

// console.log(`iface=`);
// console.dir(iface, { depth: 2 });

function getReq() {
  return { id: 1, FC: 3, addr: 0x1, data: 0x1, timeout: 1500 };
}

function log(err, data, ln = "log::") {
  console.log(ln + "err=");
  console.dir(err);
  console.log(ln + "data=");
  console.dir(data);
}

describe("class_RS485_iface_test", () => {
  describe("reading", () => {
    test("incorrect device address", (t, done) => {
      let req = getReq();
      req.id = 55;
      iface.send(req, (err, data) => {
        // log(err, data, "incorrect device address::");
        try {
          equal(data, null, "data must be null");
          equal(
            err.code,
            13,
            "Incorrect address must be error.code=13 - timeout",
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    test("corect rs485 address + correct register", (t, done) => {
      let req = getReq();
      let ln = "corect rs485 address + correct register::";
      // console.log(ln + " started");
      iface.send(req, (err, data) => {
        // log(err, data, ln + "in callback::");
        try {
          equal(err, null, "err must be null");
          let v = data.readUint16BE();
          ok(v > -10 && v < 500, "data must be between -10...500");
          done();
        } catch (error) {
          done(error);
        }
      });
    });
    test("incorect register address", (t, done) => {
      let req = getReq();
      req.addr = 6;
      iface.send(req, (err, data) => {
        // log(err, data, "incorrect reg::");
        try {
          equal(data, null, "data must be null");
          equal(err.code, 2, "err code must be 2");
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  }); // describe reading

  describe("writing", () => {
    test("incorect register address", (t, done) => {
      let req = getReq();
      req.FC = 6;
      req.addr = 6;
      iface.send(req, (err, data) => {
        // log(err, data, "incorrect reg::");
        try {
          equal(data, null, "data must be null");
          equal(err.code, 2, "err code must be 2");
          done();
        } catch (error) {
          log(err, data, "incorect register address::");
          console.dir(dev);
          done(error);
        }
      });
    }); //test

    test("incorect address", (t, done) => {
      let req = getReq();
      req.FC = 6;
      req.id = 55;
      iface.send(req, (err, data) => {
        // log(err, data, "incorrect reg::");
        try {
          equal(data, null, "data must be null");
          equal(err.code, 13, "err code must be 13");
          done();
        } catch (error) {
          done(error);
        }
      });
    }); //test

    test("corect address and register", (t, done) => {
      let req = getReq();
      req.FC = 6;
      req.addr = 0x0100;
      req.data = 55;
      iface.send(req, (err, data) => {
        // log(err, data, "correct reg::");
        try {
          equal(err, null, "err should be null");
          let v = data.readUint16BE();
          equal(v, 55, "data must be 55");
          done();
        } catch (error) {
          log(err, data, "corect address and register::");
          done(error);
        }
      });
    }); //test
  }); // describe("writing"
});
