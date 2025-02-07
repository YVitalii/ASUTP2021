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

    it("if any methods not defined, default methods(arg) should return {err:null,data:arg}}", () => {
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        let res = item[element]({ value: 5 });
        assert.equal(res.err, null);
        assert.equal(res.data.value, 5);
      }
    });

    it("if methods are defined, should return '{err:null,data:{value:arg.value+1,id:this.id}' or if arg=value=3 shoud {err:new Error(),data:null}", () => {
      let errNumber = 2;
      let testFunction = function (arg = {}) {
        // імітування помилки
        if (arg.value == errNumber) {
          return {
            err: new Error(`should be not equivalent ${errNumber}`),
            data: null,
          };
        }
        // імітування успішної обробки
        return { err: null, data: { value: arg.value + 1, id: this.id } };
      };
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        props[element] = testFunction;
      }
      let item = new Register(props);
      for (let i = 0; i < functions.length; i++) {
        const element = functions[i];
        let res = item[element]({ value: i });
        if (i == errNumber) {
          assert.notEqual(res.err, null);
          assert.equal(res.data, null);
        } else {
          assert.equal(res.err, null);
          assert.equal(res.data.value, i + 1);
          assert.equal(res.data.id, props.id);
        }
      }
    }); //it("if methods are defined,
  });
});
