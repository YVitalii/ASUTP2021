const assert = require("assert");
const ClassRegGeneral = require("./ClassDevManagerRegGeneral.js");
const { expect } = require("chai");

describe("testing ClassDevManagerRegGeneral", () => {
  let props = {
    id: "testRegister",
    header: {
      ua: `Тестовий регістр`,
      en: `testRegister`,
      ru: `Тестовый регистр`,
    },
  };
  describe("units", () => {
    it("Empty units", () => {
      let res = new ClassRegGeneral(props);
      assert.equal(res.units.ua, "");
    });
    it("Defined units", () => {
      props.units = { ua: `сек`, en: `sec`, ru: `сек` };
      let res = new ClassRegGeneral(props);
      assert.equal(res.units.ua, props.units.ua);
    });
  });

  describe("type", () => {
    it("type=undefined", () => {
      let res = new ClassRegGeneral(props);
      assert.equal(res.type, "text");
    });
    it("wrong", () => {
      props.type = "wrong";
      assert.throws(() => {
        let res = new ClassRegGeneral(props);
      });
    });
    it("number", () => {
      props.type = "number";
      let res = new ClassRegGeneral(props);
      assert.equal(res.type, "number");
    });
  });

  describe("min & max", () => {
    it("min and max = undefined", () => {
      let res = new ClassRegGeneral(props);
      assert.equal(res.min, undefined);
      assert.equal(res.max, undefined);
    });
    it("number 0..1000", () => {
      props.type = "number";
      props.min = 0;
      props.max = 1000;
      let res = new ClassRegGeneral(props);
      assert.equal(res.min, 0);
      assert.equal(res.max, 1000);
    });
  });

  describe("driverRegName", () => {
    it("undefined", () => {
      let res = new ClassRegGeneral(props);
      assert.equal(res.driverRegName, props.id);
    });
    it("DI01", () => {
      props.driverRegName = "DI01";
      let res = new ClassRegGeneral(props);
      assert.equal(res.driverRegName, "DI01");
    });
  });

  describe("obsolescense", () => {
    it("should set obsolescence to 30 if props.obsolescence is not a number", () => {
      const props = { obsolescence: "not a number" };
      const instance = new ClassDevManagerRegGeneral(props);
      expect(instance.obsolescence).to.equal(30);
    });

    it("should set obsolescence to the provided number if props.obsolescence is a number", () => {
      const props = { obsolescence: "45" };
      const instance = new ClassDevManagerRegGeneral(props);
      expect(instance.obsolescence).to.equal(45);
    });

    it("should set obsolescence to 30 if props.obsolescence is undefined", () => {
      const props = {};
      const instance = new ClassDevManagerRegGeneral(props);
      expect(instance.obsolescence).to.equal(30);
    });

    it("should set obsolescence to 30 if props.obsolescence is null", () => {
      const props = { obsolescence: null };
      const instance = new ClassDevManagerRegGeneral(props);
      expect(instance.obsolescence).to.equal(30);
    });
  });
});
