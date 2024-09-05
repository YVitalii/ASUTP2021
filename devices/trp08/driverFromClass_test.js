const driver = require("./driverFromClass");
const assert = require("assert");
//const iface = require("../../conf_iface").w2;

// let test = [
//   {
//     id: "state",
//     _get: [
//       {
//         arg: 0,
//         ret: { FC: 3, addr: 0, data: 1 },
//       },
//     ],
//     get_: [
//       { arg: new Buffer.from([0, 23]), ret: { err: null, data:{value: 23} } },
//       { arg: new Buffer.from([0, 16]), ret: { data:{value: null}  } },
//     ],
//     _set:[
//       {arg: 0,ret:{data:{value:null}}},
//       {arg:17,ret:{data:{value:null}}},
//     ]
//   },
// ];

describe("driverFromClass internal testing ", () => {
  describe("Import driver", () => {
    it('driver.id="trp08"', () => {
      assert.equal(driver.id, "trp08");
      assert.equal(driver.header.en, "TRP-08-TP");
      assert.equal(driver.timeout, 2000);
    });
  });
  describe("Register testing", () => {
    // ---------- state -----------
    describe(" state", () => {
      let reg = driver.regs.get("state"),
        addr = reg.addr;
      it("address", () => {
        assert.equal(reg.addr, 0);
      });
      it("_get()", () => {
        assert.deepEqual(
          reg._get(),
          { err: null, data: { FC: 3, addr, data: 1 } },
          "_get error"
        );
      });
      it("get_()", () => {
        let res = reg.get_(new Buffer.from([0, 23]));
        assert.equal(res.data.value, 23, "error value");
        res = reg.get_(new Buffer.from([0, 25]));
        assert.notEqual(res.err, null, "Bed arg: err == null");
        assert.equal(res.data.value, null, "Bed arg: data != null");
      });
      it("_set()", () => {
        let res = reg._set(17);
        assert.deepEqual(res, {
          data: { FC: 6, addr, data: 17 },
          err: null,
        });
        res = reg._set(1);
        assert.deepEqual(res, { data: { FC: 6, addr, data: 1 }, err: null });
        res = reg._set(12);
        assert.notEqual(res.err, null, "Bed arg: err == null");
        assert.equal(res.data.value, null, "Bed arg: data != null");
      });
      it("set_()", () => {
        let res = reg.set_(new Buffer.from([0, 17]));
        assert.equal(res.err, null, "err != null");
        assert.equal(res.data.value, 17, "data.value != 17");
      });
    }); //describe(" state"
  });
}); //describe("driverFromClass testing"
