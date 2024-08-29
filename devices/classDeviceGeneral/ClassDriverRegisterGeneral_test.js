const Register = require("./ClassDriverRegisterGeneral");

const assert = require("assert");

let props = { id: "testReg" };
describe("constructor", () => {
  describe("properties", function () {
    //----- addr -----------
    it("should be Error, if 'addr' not present. ", function () {
      assert.throws(() => {
        let item = new Register(props);
      }, Error);
    });

    //----- units --------------
    it("if units not present, must be equivalent to ''", function () {
      props.addr = "0x001";
      let item = new Register(props);
      assert.equal(item.units.ua, "");
    });
    it("if units present, this.units.ua must be equivalent to props.units.ua", function () {
      props.units = { ua: `C`, en: `C`, ru: `C` };
      let item = new Register(props);
      assert.equal(item.units.en, props.units.en);
    });
  }); // describe("properties"
  describe("methods", () => {
    let props = { id: "testReg", addr: "0x0001" };
    let item = new Register(props);
    let functions = ["_get", "get_", "_set", "set_"];

    it("if any methods not defined, default methods should return this.id", () => {
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        assert.equal(item[element](), item.id);
      }
    });

    it("if methods are defined, default methods should return 'arg'", () => {
      let testFunction = function (arg) {
        return arg;
      };
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        props[element] = testFunction;
      }
      let item = new Register(props);
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        assert.equal(item[element](i), i);
      }
    });
  });
});
