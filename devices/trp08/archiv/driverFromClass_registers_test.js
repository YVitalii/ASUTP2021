const driver = require("./driverFromClass_registers");
const assert = require("assert");

/**
 * Функція тестування що виконує загальні для всіх регістрів перевірки
 * @param {Object} reg - регістр
 * @param {Integer} addr
 * @returns it
 */
let _getFC3test = function (reg, addr) {
  return it("addr +_get()", () => {
    // ---- address testing -------
    assert.equal(reg.addr, addr, `reg.addr=${reg.addr} but must to be ${addr}`);
    // console.log("this=");
    // console.dir(this);
    // ---- _get() testing ------------
    let rightRes = { err: null, data: { FC: 3, addr, data: 1 } };
    let res = reg._get();
    // console.log("rightRes=");
    // console.dir(rightRes);
    // console.log("res=");
    // console.dir(res);
    assert.deepEqual(res, rightRes, "_get error");
  });
};

let _setFC06test = function (reg, res) {
  assert.equal(res.data.FC, 6, "data.FC must be 6");
  assert.equal(
    res.data.addr,
    reg.addr,
    `res.data.addr must be equal res.addr
    `
  );
};

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
        addr = 0x0000;
      // general tests
      _getFC3test(reg, addr);

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
        //console.dir(res);
        assert.notEqual(res.err, null, "Bad arg: err == null");
        assert.equal(res.data, null, "Bad arg: data != null");
      });
      it("set_()", () => {
        let res = reg.set_(new Buffer.from([0, 17]));
        assert.equal(res.err, null, "err != null");
        assert.equal(res.data.value, 17, "data.value != 17");
      });
    }); //describe(" state"

    // ---------- T -----------
    describe("T", () => {
      let reg = driver.regs.get("T"),
        addr = 0x0001;
      // general tests
      _getFC3test(reg, addr);

      it("get_()", () => {
        let res = reg.get_(new Buffer.from([0x01, 0x23]));
        // console.dir(res);
        assert.notEqual(res.data, null, "Bad arg: data == null");
        assert.equal(res.data.value, 123, "error value");
        assert.equal(res.err, null, "Bad arg: err == null");
      });
      it("_set()", () => {
        let res = reg._set(1);
        assert.notEqual(res.err, null, "err==null but must be an Error! ");
      });
      it("set_()", () => {
        let res = reg.set_(17);
        assert.notEqual(res.err, null, "err==null but must be an Error! ");
      });
    }); //describe("T"

    // ---------- tT -----------
    describe("tT", () => {
      let reg = driver.regs.get("tT"),
        addr = 0x0100;
      // general tests
      _getFC3test(reg, addr);

      it("get_()", () => {
        let res = reg.get_(new Buffer.from([0x01, 0x23]));
        // console.dir(res);
        assert.notEqual(res.data, null, "Bad arg: data == null");
        assert.equal(res.data.value, 123, "error value");
        assert.equal(res.err, null, "Bad arg: err == null");
      });
      it("_set()", () => {
        // wrong argument
        let res = reg._set("mm");
        assert.notEqual(res.err, null, `argument = "mm".Must be an Error `);
        // console.log("res=");
        // console.dir(res);
        res = reg._set(170);
        assert.deepEqual(res, {
          err: null,
          data: { FC: 6, addr, data: 0x0170 },
        });
        // assert.equal(res.err, null, "Correct arg: err == null");
        // assert.notEqual(res.data, null, "Correct arg: must be data!=null");
        // assert.equal(
        //   res.data.data,
        //   0x0170,
        //   `data.data=${res.data.data.toString(16)} but must be == 0x0170`
        // );
      });
      it("set_()", () => {
        let arg = "mm",
          res = reg.set_(arg);
        assert.notEqual(res.err, null, "wrong arg='mm' must be an Error! ");
        arg = new Buffer.from([0x01, 0x17]);
        res = reg.set_(arg);
        // console.dir(res);
        assert.equal(res.err, null, "Correct arg: err == null");
        assert.equal(res.data.value, 117, `data.value must be equal 117`);
      });
    }); //describe("tT"
  }); // Register testing
}); //describe("driverFromClass testing"
