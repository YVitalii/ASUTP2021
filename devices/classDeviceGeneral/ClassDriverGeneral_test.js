const ClassDriverGeneral = require("./ClassDriverGeneral");
const assert = require("assert");
const props = { id: "driverTrp08" };

// ------------ функції для імітатора iface -----------

/** функція повертає в полі data - ехо запиту req
 *  слугує для тестування поля запиту
 */
let sendEchoReq = function (req, cb) {
  setTimeout(function () {
    return cb(null, req);
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

  let regProps = {
    addr: 0x0001,
    id: "state",
    _get: function (arg) {
      return { FC: 3, addr: this.addr, data: 0x1 };
    },
    get_: function (arg) {
      return arg;
    },
    _set: function (arg) {
      return {
        FC: 6,
        addr: this.addr,
        data: arg,
      };
    },
    set_: function (arg) {
      return arg;
    },
  };
  //   console.log("driver=");
  //   console.dir(driver);
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
  describe("has()", () => {
    it("if register is present in regs return True", () => {
      assert.ok(driver.has(regProps.id));
    });
    it("if register isn't present in regs return False", () => {
      assert.ok(!driver.has("wrongReg"));
    });
  }); //describe("has()"
  describe("getReg(iface, addr, regName, cb)", () => {
    it("Should be error if received not valid iface", () => {
      assert.throws(() => {
        driver.getReg("not valid iface", 1, "state", () => {});
      }, Error);
    });
    it("Should be error if received not valid regName", () => {
      assert.throws(() => {
        driver.getReg(iface, 1, "notValidRegName", (err, data) => {});
      }, Error);
    });
    let iface = { id: "w2", send: sendEchoReq };
    it("Correct send. Testing request creation", (done) => {
      let addr = 1;
      driver.getReg(iface, addr, regProps.id, (err, data) => {
        if (err) done(err);
        // console.dir(data, { depth: 3 });
        let d = data[0];
        assert.equal(d.regName, regProps.id, "'regName' not equal");
        assert.equal(d.value.timeout, driver.timeout, "'regName' not equal");
        let val = d.value;
        assert.equal(val.FC, 3, "'FC' not equal 3");
        assert.equal(val.addr, addr, `'addr' not equal ${addr}`);
        assert.equal(val.data, 1, "'data not equal 1");
        done();
      });
    });
  });
});
