const f = require("./driver_generalFunctions");
const assert = require("assert");
const { describe, it } = require("node:test");

describe("driver_generalFunctions testing", () => {
  let arg;
  describe("fromBCD()", () => {
    it('wrong argument "mm"', () => {
      assert.throws(() => {
        let res = f.fromBCD("mm");
      }, "Should be an Error");
      //   console.dir(res);
    });
    it('Correct argument "0155"', () => {
      let res = f.fromBCD(new Buffer.from([0x01, 0x55]));
      assert.equal(res, 155);
      //   console.dir(res);
    });
  }); //describe("fromBCD()"

  describe("toBCD()", () => {
    it('wrong argument "mm"', () => {
      assert.throws(() => {
        let res = f.toBCD("mm");
      }, "Should be an Error");
      //   console.dir(res);
    });
    it('Correct argument "0x0155=341"', () => {
      let res = f.toBCD(155);
      assert.equal(res, 0x0155);
      //   console.dir(res);
    });
  }); // describe('toBCD()'

  describe("fromClock()", () => {
    let arg = "123";
    it(`wrong argument ${arg}`, () => {
      assert.throws(() => {
        let res = f.fromClock(arg);
      }, "Should be an Error");
    });

    it(`Correct argument "0x0130=90"`, () => {
      let arg = new Buffer.from([0x01, 0x30]);
      let res = f.fromClock(arg);
      assert.equal(res, 90);
      //   console.dir(res);
    });
  }); // describe('toBCD()'

  describe("toClock()", () => {
    it(`wrong argument "mm"`, () => {
      assert.throws(() => {
        let res = f.toClock("mm");
      }, "Should be an Error");
    });

    it(`Correct argument "123хв=0x0203=02:03=515"`, () => {
      let res = f.toClock(123);
      //console.dir(res);
      assert.equal(res, 0x0203);
    });
  }); // describe('toBCD()'
});
