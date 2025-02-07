const f = require("./driver_generalFunctions");
const assert = require("assert");

describe("driver_generalFunctions testing", () => {
  let arg;
  describe("fromBCD()", () => {
    it('wrong argument "mm"', () => {
      let res = f.fromBCD("mm");
      assert.notEqual(res.err, null);
      //   console.dir(res);
    });
    it('Correct argument "0155"', () => {
      let res = f.fromBCD(new Buffer.from([0x01, 0x55]));
      assert.equal(res.data.value, 155);
      //   console.dir(res);
    });
  }); //describe("fromBCD()"

  describe("toBCD()", () => {
    it('wrong argument "mm"', () => {
      let res = f.toBCD("mm");
      assert.notEqual(res.err, null);
      //   console.dir(res);
    });
    it('Correct argument "0x0155=341"', () => {
      let res = f.toBCD(155);
      assert.equal(res.data.data, 0x0155);
      //   console.dir(res);
    });
  }); // describe('toBCD()'

  describe("fromClock()", () => {
    let arg = "123";
    it(`wrong argument ${arg}`, () => {
      let res = f.fromClock(arg);
      //console.dir(res);
      assert.notEqual(res.err, null);
    });

    it(`Correct argument "0x0130=90"`, () => {
      let arg = new Buffer.from([0x01, 0x30]);
      let res = f.fromClock(arg);
      assert.equal(res.data.value, 90);
      //   console.dir(res);
    });
  }); // describe('toBCD()'

  describe("toClock()", () => {
    it(`wrong argument "mm"`, () => {
      let res = f.toClock("mm");
      //console.dir(res);
      assert.notEqual(res.err, null);
    });

    it(`Correct argument "123хв=0x0203=02:03=515"`, () => {
      let res = f.toClock(123);
      //console.dir(res);
      assert.equal(res.err, null);
      assert.equal(res.data.data, 0x0203);
    });
  }); // describe('toBCD()'
});
