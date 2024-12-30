const Register = require("./ClassGeneral");

const assert = require("assert");

let props = {};
describe("constructor", () => {
  describe("properties", function () {
    //----- id -----------
    it("should be Error, if 'id' not present. ", function () {
      assert.throws(() => {
        let item = new Register(props);
      }, Error);
    });

    //----- header -----------
    it("if header not present, must be equivalent to 'id'", function () {
      props.id = "testReg";
      let item = new Register(props);
      assert.equal(item.id, props.id);
    });
    it("if header present, this.header.ua must be equivalent to props.header.ua", function () {
      props.header = { ua: `Тестування`, en: `Testing`, ru: `Тестирование` };
      let item = new Register(props);
      assert.equal(item.header.en, props.header.en);
    });

    // ----- comment ---------
    it("if comment not present, must be equivalent to ''", function () {
      let item = new Register(props);
      assert.equal(item.comment.ua, "");
    });
    it("if comment present, this.comment.ua must be equivalent to props.comment.ua", function () {
      props.comment = { ua: `C`, en: `C`, ru: `C` };
      let item = new Register(props);
      assert.equal(item.comment.en, props.comment.en);
    });
  });
});
