// cd ./rs485
// supervisor --no-restart-on exit ./tests/GeneralDeviceEmulatorClass_test.js

const GeneralDeviceEmulatorClass = require("../GeneralDeviceEmulatorClass");
const dev = new GeneralDeviceEmulatorClass({ id: "test" });

const { equal, ifError } = require("assert");

console.log(`dev=`);
console.dir(dev, { depth: 2 });

try {
  equal(
    dev instanceof GeneralDeviceEmulatorClass,
    true,
    "Помилка: об'єкт не є екземпляром GeneralDeviceEmulatorClass",
  );
  equal(dev.id, "test", "Помилка: не встановлено id пристрою");
} catch (error) {
  console.error(error.message);
}

try {
  dev.addReg({
    addr: 23,
    _value: 42,
    set value(val) {
      this._value = val;
    },
    get value() {
      return this._value;
    },
  });
  equal(
    dev.getReg(23).value,
    42,
    "Помилка: неправильне значення регістра після додавання",
  );
  dev.getReg(23).value = 100;
  equal(
    dev.getReg(23).value,
    100,
    "Помилка: неправильне значення регістра після встановлення нового значення",
  );
  ifError(
    dev.getReg(999),
    "Помилка: getReg має повертати null для неіснуючого регістра",
  );
} catch (error) {}
