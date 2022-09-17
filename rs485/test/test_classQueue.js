const assert = require("assert");
const Queue = require("../classQueue.js");

let q = new Queue();
console.dir(q, { depth: 4 });
describe("-------- test base function ------------", function () {
  it("iterate empty queue", function () {
    let { end, value } = q.next();
    assert.equal(end, true);
  });
  it("add registers 1-T; 2-T ", function () {
    assert.equal(q.add("1-T"), true);
    assert.equal(q.add("2-T"), true);
  });
  it("add dublicate registers 1-T ", function () {
    assert.equal(q.add("1-T"), false);
  });
  it("delete register 1-T ", function () {
    assert.equal(q.delete("1-T"), true);
  });
  it("delete not registered  bad-Reg ", function () {
    assert.equal(q.delete("bad-Reg"), false);
  });
  it("get length = 1", function () {
    assert.equal(q.length, 1);
  });
}); // describe

describe(" ---------- test next metod  ---------------", function () {
  let arr = ["1-T", "2-T", "3-T"];
  before(function () {
    q.delete("2-T");
    for (let i = 0; i < arr.length; i++) {
      q.add(arr[i]);
    }
  }); // before
  for (let i = 0; i < arr.length; i++) {
    let regName = arr[i];
    it(`next()=${regName}`, function () {
      let { end, value } = q.next();
      assert.equal(value, regName);
    });
  }
  it(" must be end = true", function () {
    let { end, value } = q.next();
    assert.ok(end);
  });
  it(" must be end " + arr[0] + " again", function () {
    let { end, value } = q.next();
    assert.equal(value, arr[0]);
  });
});
