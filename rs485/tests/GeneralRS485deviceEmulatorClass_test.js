// cd ./rs485
// supervisor --no-restart-on exit ./tests/GeneralRS485deviceEmulatorClass_test.js
const GeneralDeviceEmulatorClass = require("../GeneralRS485deviceEmulatorClass");

const dev = new GeneralDeviceEmulatorClass({ id: "test" });
dev.counter = 0;
const CRC = require("../../tools/CRC");
const parseBuf = require("../../tools/parseBuf");
const { equal, ifError } = require("assert");
const { test, describe, it } = require("node:test");
const startReg = 0x23;

dev.addReg({
  addr: startReg,
  value: 42,
  id: "tT",
});

dev.addReg({
  addr: startReg + 1,
  value: 43,
  id: "T",
  setR: function (val) {
    this.parent.counter += 1;
    if (val == 8) {
      throw new Error("Error value");
    }
    this._value = val;
    return val;
  },
});

dev.addReg({
  addr: startReg + 2,
  _value: 44,
  set value(val) {
    this._value = val;
    this.parent.counter += 1;
  },
  get value() {
    return this._value;
  },
});

console.log(`dev=`);
console.dir(dev, { depth: 2 });

describe("test Device creation", () => {
  try {
    regAddr = startReg;
    equal(
      dev instanceof GeneralDeviceEmulatorClass,
      true,
      "Помилка: об'єкт не є екземпляром GeneralDeviceEmulatorClass",
    );
    equal(dev.id, "test", "Помилка: не встановлено id пристрою");

    equal(
      dev.getReg(regAddr).value,
      42,
      "Помилка: неправильне значення регістра після додавання",
    );
    dev.getReg(regAddr).value = 100;
    equal(
      dev.getReg(regAddr).value,
      100,
      "Помилка: неправильне значення регістра після встановлення нового значення",
    );
    ifError(
      dev.getReg(999),
      "Помилка: getReg має повертати null для неіснуючого регістра",
    );
  } catch (error) {
    console.error(error.message);
  }
});

describe("test FC3", () => {
  test("FC3; right request; single register", () => {
    let regAddr = startReg,
      req = Buffer.from([1, 3, 0, regAddr, 0, 1]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC3(req);
    equal(res.readInt8(0), 3, "Функція повинна бути 03");
    equal(res.readInt8(1), 2, "Кількість байт відповіді повинна бути 2");
    equal(
      res.readInt16BE(2),
      dev.getReg(regAddr).value,
      `Значення регістру повинно бути ${dev.getReg(regAddr).value}`,
    );
  }); //test
  test("FC3; right request; multiple register", () => {
    let regsCount = 3,
      regAddr = startReg;
    let req = Buffer.from([1, 3, 0, regAddr, 0, regsCount]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC3(req);
    equal(
      res.readInt8(1),
      regsCount * 2,
      "Кількість байт відповіді повинна бути 2",
    );
    for (let i = 0; i < regsCount; i++) {
      equal(
        res.readInt16BE(2 + i * 2),
        dev.getReg(regAddr + i).value,
        `Значення регістру повинно бути ${dev.getReg(regAddr + i).value}`,
      );
    }
  }); // test
  test("FC3; unsuported register", () => {
    let regsCount = 3,
      regAddr = startReg + 5;
    let req = Buffer.from([1, 3, 0, regAddr, 0, regsCount]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC3(req);
    equal(
      res.readUInt8(0),
      0b10000000 + 3,
      "Номер функції повинен бути 128+3=130",
    );
    equal(res.readInt16BE(1), 2, "Error code must be 2");
  }); // test
}); // describe FC3 test

describe("test FC6", () => {
  test("unsuported register", () => {
    let regValue = 5,
      regAddr = 0x55;
    let req = Buffer.from([1, 6, 0, regAddr, 0, regValue]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC6(req);
    equal(
      res.readUInt8(0),
      0b10000000 + 6,
      "Номер функції повинен бути 128+6=134",
    );
    equal(res.readInt16BE(1), 2, "Error code must be 2");
  }); // test

  test("unsuported data", () => {
    let regValue = 8,
      startReg = 0x24;
    let req = Buffer.from([1, 6, 0, startReg, 0, regValue]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC6(req);
    equal(
      res.readUInt8(0),
      0b10000000 + 6,
      "Номер функції повинен бути 128+6=134",
    );
    equal(res.readInt16BE(1), 3, "Error code must be 3 - unsuported data");
  }); // test

  test("right request; write single register", () => {
    let regAddr = startReg,
      val = 5;
    req = Buffer.from([1, 6, 0, regAddr, 0, val]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC6(req);
    let str = ` but [${parseBuf(res)}]`;
    equal(res.readUInt8(0), 6, `Функція повинна бути 0x06` + str);
    equal(
      res.readUint16BE(1),
      req.readUint16BE(2),
      "Адреса регістру повинна співпадати з запитом" + str,
    );
    equal(
      res.readInt16BE(3),
      dev.getReg(regAddr).value,
      `Значення регістру повинно бути ${dev.getReg(regAddr).value}`,
    );
  }); //test
});

describe("test FC16", () => {
  test("unsuported register", () => {
    let regValue = 5,
      startReg = 0x55;

    // prettier-ignore
    let req = Buffer.from([
      1, // 0 device address
      16, // 1 function code
      0, startReg, //2,3 start register
      0,2, //4,5 quantity registers
      4, //6 quantity data bytes
      0x00, 0x01, //7,8 data
      0x00, 0x02, //9,10
    ]);

    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC16(req);
    equal(
      res.readUInt8(0),
      0b10000000 + 16,
      "Номер функції повинен бути 128+16=144",
    );
    equal(res.readInt16BE(1), 2, "Error code must be 2");
  }); // test
  test("right request, set multiple regs", () => {
    let startRegValue = 5,
      regAddr = startReg,
      regsQuantity = 2;
    // prettier-ignore
    let req = Buffer.from([
      1, // 0 device address
      16, // 1 function code
      0, regAddr, //2,3 start register
      0,regsQuantity, //4,5 quantity registers
      4, //6 quantity data bytes
      0x00, startRegValue, //7,8 data
      0x00, startRegValue+1, //9,10
    ]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC16(req);
    let str = ` but res=[${parseBuf(res)}]`;
    equal(res.readUInt8(0), 0x10, "Function must be 0x10" + str);
    equal(
      res.readUInt16BE(1),
      regAddr,
      "Address for the start register must be equivalent to request" + str,
    );
    equal(
      res.readUInt16BE(3),
      regsQuantity,
      "Quantity of regs must be 2" + str,
    );
    // console.dir(dev);
    for (let i = 0; i < regsQuantity; i++) {
      equal(
        req.readInt16BE(7 + i * 2),
        dev.getReg(regAddr + i).value,
        `Must be: reg [${regAddr + 1}] = ${req.readInt16BE(7 + i * 2)}, but ${dev.getReg(regAddr + i).value}`,
      );
    }
  }); // test("right request, set multiple regs"
  test("right request, wrong data", () => {
    let startRegValue = 7,
      regAddr = startReg,
      regsQuantity = 2;
    // prettier-ignore
    let req = Buffer.from([
      1, // 0 device address
      16, // 1 function code
      0, regAddr, //2,3 start register
      0, regsQuantity, //4,5 quantity registers
      4, //6 quantity data bytes
      0x00, startRegValue, //7,8 data
      0x00, startRegValue+1, //9,10
    ]);
    let crc = CRC.getCRC(req);
    req = Buffer.concat([req, crc], req.length + 2);
    let res = dev.FC16(req);
    let str = ` but res=[${parseBuf(res)}]`;
    // console.dir(dev);
    equal(
      res.readUInt8(0),
      0b10000000 + 16,
      "Номер функції повинен бути 128+16=144" + str,
    );
    equal(res.readInt16BE(1), 3, "Error code must be 3" + str);
  }); // test("right request, set multiple regs"
});

describe("testing dev.write() function", (t) => {
  let value = 55;
  test("FC6 write [01-06-00-startReg-00-55]", async (t) => {
    let req = Buffer.from([1, 6, 0, startReg, 0, value]);
    let res = await dev.write(req);
    try {
      equal(dev.getReg(startReg).value, value, `Should be equal ${value}`);
    } catch (error) {
      console.dir(res);
      console.error("ERROR::" + error.message);
      throw new Error(error);
    }
  });
  test("FC3 read [01-03-00-startReg-00-01]", async () => {
    let req = Buffer.from([1, 3, 0, startReg, 0, 1]);
    let res = await dev.write(req);
    equal(dev.getReg(startReg).value, value, `Should be equal ${value}`);
  });
});
