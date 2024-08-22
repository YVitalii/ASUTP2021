// mocha  ../tests/t_createDriverGeneral.js -w
const ClassDriverGeneral = require("../ClassDriverGeneral");

const assert = require("assert");

let props = {};

describe("constructor", function () {
  it("should be Error, if 'id' not present. ", function () {
    assert.throws(() => {
      let item = new ClassDriverGeneral(props);
    }, Error);
  });
  it('If "id" is present go next.', () => {
    props.id = "test";
    assert.doesNotThrow(() => {
      let item = new ClassDriverGeneral(props);
    }, Error);
  });
  it("should be Error, if 'addr' not present. ", function () {
    assert.throws(() => {
      console.dir(props.addr);
      let item = new ClassDriverGeneral(props);
    }, Error);
  });
});

// describe("testCreating istance of ClassDriverGeneral", function () {
//     describe("Create with empty 'id'", function () {});
//   });
