// cd ./rs485
// supervisor --no-restart-on exit ./tests/serialPortFabric_test.js

const assert = require("assert");
const { describe, test, it } = require("node:test");
const getSerialPort = require("../serialPortFabric.js");
const config = require("../../config.js");

describe("SerialPortFabric", { concurrency: 1 }, () => {
  describe("serialPortEmulator", () => {
    const serialPort = getSerialPort(1);
    it("should load the SerialEmulator class when emulateRS485 is enabled", () => {
      assert.equal(
        serialPort.name,
        "SerialEmulator",
        "Помилка: не завантажено емулятор послідовного порту RS485",
      );
    }); // it
  });

  describe("real serialport", () => {
    const serialPort = getSerialPort(0); // вимикаємо емуляцію rs485;
    it("should load the serialport class when emulateRS485 is enabled", () => {
      assert.equal(
        serialPort.name,
        "SerialPort",
        "Помилка: не завантажено реальний послідовний порт RS485",
      );
    }); // it
  });
}); //describe
