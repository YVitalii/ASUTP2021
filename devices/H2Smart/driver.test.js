const chai = require("chai");
const sinon = require("sinon");
const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const driverModule = require("./driver");

const { expect } = chai;

describe("H2Smart Driver", function () {
  let driver;

  beforeEach(function () {
    driver = new ClassDriverGeneral({
      id: "H2smart",
      header: { ua: `H2-smart`, en: `H2-smart`, ru: `H2-smart` },
      comment: {
        ua: `Дисоціометр аміаку`,
        en: `Dissociation meter of ammonia`,
        ru: `Дисоциометр амиака`,
      },
      timeout: 3000,
    });
  });

  describe("Registers", function () {
    it("should throw an error for read-only registers", function () {
      const env = { id: "Dissociation" };
      expect(() => driverModule.readOnly(env)).to.throw(
        `Register "Dissociation" is readonly !`
      );
    });

    it("should convert buffer data to number correctly", function () {
      const buffer = Buffer.from([0x00, 0x10]);
      const env = { ln: "log", id: "test" };
      const result = driverModule.toNumber(buffer, env);
      expect(result).to.equal(16);
    });

    it("should convert string data to number correctly", function () {
      const data = "20";
      const env = { ln: "log", id: "test" };
      const result = driverModule.toNumber(data, env);
      expect(result).to.equal(20);
    });

    it("should throw an error for invalid number conversion", function () {
      const data = "invalid";
      const env = { ln: "log", id: "test" };
      expect(() => driverModule.toNumber(data, env)).to.throw(
        "logtoNumber():id=test::Invalid number"
      );
    });

    it("should return correct data for _getFC3 function", function () {
      const env = { addr: 0x0001 };
      const result = driverModule._getFC3(env);
      expect(result).to.deep.equal({
        data: {
          FC: 3,
          addr: 0x0001,
          data: 0x2,
        },
        err: null,
      });
    });

    it("should set data correctly for enableSampling register", function () {
      const env = { addr: 0x0009, ln: "log", id: "enableSampling" };
      const arg = 1;
      const result = driverModule.driver.registers.enableSampling._set.call(
        env,
        arg
      );
      expect(result).to.deep.equal({
        data: { FC: 6, addr: 0x0009, data: 1 },
        err: null,
      });
    });

    it("should throw an error for invalid data in enableSampling register", function () {
      const env = { addr: 0x0009, ln: "log", id: "enableSampling" };
      const arg = 2;
      const result = driverModule.driver.registers.enableSampling._set.call(
        env,
        arg
      );
      expect(result.err).to.be.an("error");
      expect(result.data).to.be.null;
    });
  });
});
