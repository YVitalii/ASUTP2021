const ClassDriverGeneral = require("./ClassDriverGeneral");
const assert = require("assert");
const props = { id: "driverTrp08" };

// ------------ функції для імітатора iface -----------

/** функція повертає в полі data - ехо запиту req
 *  слугує для тестування поля запиту
 */
let sendEchoReq = function (req, cb) {
  setTimeout(function () {
    return cb(null, 1111);
  }, 1000);
};

/** функція повертає в полі data= req.data
 * слугує для тестування нормальної відповіді
 */
let send = function (req, cb) {
  setTimeout(function () {
    return cb(null, req.data);
  }, 1000);
};

describe("Testing ClassDriverGeneral", () => {
  let driver = new ClassDriverGeneral(props);
  // ---- опис регістру -----
  let regProps = {
    addr: 0x0001,
    id: "state",
    _get: function (arg) {
      return { err: null, data: { FC: 3, addr: this.addr, data: 0x1 } };
    },
    get_: function (arg) {
      return { err: null, data: { value: arg } };
    },
    _set: function (arg) {
      return { err: null, data: { FC: 6, addr: this.addr, data: arg } };
    },
    set_: function (arg) {
      return { err: null, data: { value: arg } };
    },
  };
  //   console.log("driver=");
  //   console.dir(driver);

  // ------ addRegister ---------------
  describe("addRegister()", () => {
    it("should be Error, if props not have field 'addr'", function () {
      assert.throws(() => {
        driver.addRegister({ id: "state" });
      }, Error);
    });

    it("add new register", () => {
      let reg = driver.addRegister(regProps);
      assert.equal(reg.addr, regProps.addr);
      assert.equal(reg.id, regProps.id);
    });

    it("should be Error, if add dublicate of register", function () {
      assert.throws(() => {
        driver.addRegister(regProps);
      }, Error);
    });
  }); //describe("addRegister()"

  // ---- has ------
  describe("has()", () => {
    it("if register is present in regs return True", () => {
      assert.ok(driver.has(regProps.id));
    });
    it("if register isn't present in regs return False", () => {
      assert.ok(!driver.has("wrongReg"));
    });
  }); //describe("has()"

  // -----------   getReg + getRegPromise -------------
  describe("getReg(iface, addr, regName, cb)", () => {
    let iface = { id: "w2", send: sendEchoReq };

    it("Should be error if received not valid iface", () => {
      assert.throws(
        () => {
          driver.getReg("not valid iface", 1, "state", () => {});
        },
        { message: /iface.send must be an async function/ }
      );
    });
    it("Should be error if received not valid regName", () => {
      assert.throws(
        () => {
          driver.getReg(iface, 1, "notValidRegName", (err, data) => {});
        },
        { message: /regName=/ }
      );
    });

    it("Correct send. Test creation the request ", (done) => {
      let addr = 1;
      driver.getReg(iface, addr, regProps.id, (err, data) => {
        // console.log("---- Test creation the request ---- ");
        // console.dir({ err, data }, { depth: 4 });
        if (err) done(err);
        // `console.dir(data, { depth: 3 });
        assert.ok(Array.isArray(data), "data must be an Array");
        let d = data[0];
        assert.equal(d.regName, regProps.id, "'regName' is not equal");
        assert.equal(d.value, 1111);
        let req = d.detail.request;
        assert.equal(req.timeout, driver.timeout, "'timeout' is not equal");
        assert.equal(req.FC, 3, "'FC' is not equal 3");
        assert.equal(req.addr, addr, `'addr' is not equal ${addr}`);
        assert.equal(req.data, 1, "'data is not equal 1");
        done();
      });
    });

    //---------- getRegPromise(props) ----------------
    describe("getRegPromise(props) testing", () => {
      it("Should be error if received not valid props= undefined or {}", async () => {
        try {
          await driver.getRegPromise();
          assert.ok(false);
        } catch (error) {}
        try {
          await driver.getRegPromise({});
          assert.ok(false);
        } catch (error) {}
      }); // it("Should be error if received not valid props",
      it("Correct send 1111", async () => {
        try {
          let res = await driver.getRegPromise({
            iface,
            id: 1,
            regName: regProps.id,
          });
          // console.log(`res=`);
          // console.dir(res);
          assert.equal(res[0].regName, regProps.id, "'regName' is not equal");
          assert.equal(res[0].value, 1111, "'value != 1111");
        } catch (error) {
          assert.ok(false, "An Error happen:" + error.message);
        }
      });
    }); //describe('testing getRegPromise(props)'
  }); //describe("getReg(iface, addr, regName, cb)"

  describe("setReg()", () => {
    let iface = { id: "w2", send: sendEchoReq };

    it("Should be error if received not valid iface", () => {
      assert.throws(
        () => {
          driver.setReg("not valid iface", 1, "state", 1, () => {});
        },
        { message: /iface.send must be an async function/ }
      );
    });
    it("Should be error if received not valid regName", () => {
      assert.throws(
        () => {
          driver.setReg(iface, 1, "notValidRegName", (err, data) => {});
        },
        { message: /regName=/ }
      );
    });
    it("Must be Error when value == undefined or null", () => {
      assert.throws(
        () => {
          driver.setReg(iface, 1, regProps.id, undefined, (err, data) => {});
        },
        { message: /value must be defined/ }
      );
    });
    it("Good request", (done) => {
      let val = 55,
        rs485addr = 2;
      driver.setReg(iface, rs485addr, regProps.id, val, (err, data) => {
        if (err) {
          done(err);
        }
        if (0) {
          console.log(`data=`);
          console.dir(data);
        }
        assert.equal(
          data.regName,
          regProps.id,
          "regName not equal regProps.id"
        );
        assert.equal(data.value, 1111, "data.value != 1111");
        let d = data.detail.request;
        assert.equal(d.FC, 6, "FC!=6");
        assert.equal(d.addr, 1, "addr!=1");
        assert.equal(d.data, val, `data!=${val}`);
        assert.equal(d.timeout, driver.timeout, `timeout!=driver.timeout`);
        assert.equal(d.id, rs485addr, `id!=${rs485addr}`);
        done();
      });
    });

    describe("setRegPromise()", () => {
      let props = { iface, addr: 5, regName: regProps.id, value: 77 };
      it("Should be error if received not valid props= undefined or {}", async () => {
        try {
          await driver.setRegPromise();
          assert.ok(false);
        } catch (error) {}
        try {
          await driver.setRegPromise({});
          assert.ok(false);
        } catch (error) {
          let trace = 0;
          if (trace) {
            console.log(`error.message=`);
            console.dir(error.message);
          }
        }
      }); // it("Should be error if received not valid props",
      it(`Correct send ${props.value}`, async () => {
        try {
          let res = await driver.setRegPromise(props);
          // console.log(`res=`);
          // console.dir(res);
          assert.equal(res.regName, regProps.id, "'regName' is not equal");
          assert.equal(res.value, 1111, "'value != 1111");
        } catch (error) {
          assert.ok(false, "An Error happen:" + error.message);
        }
      });
    }); //describe('setRegPromise()'
    describe("getRegsDescription", () => {
      it("", () => {
        driver.printRegsDescription();
      });
    });
  }); // describe("setReg()"
}); //describe("Testing ClassDriverGeneral"
