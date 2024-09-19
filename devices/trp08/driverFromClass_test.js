/** тестування роботи драйвера з фізичним приладом */
const driver = require("./driverFromClass");
const assert = require("assert");
let iface;
iface = require("../../conf_iface").w2;
const addr = 1; // адреса приладу в інтерфейсі rs485
const dummy = require("../../tools/dummy").dummyPromise;

describe("test rs485 communication", function () {
  //console.log("this.timeout=");
  //   console.dir(this.timeout);
  this.timeout(10000);
  before(async function () {
    let ln = "before()::";
    // вимикаємо лічильник часу виконання, інакше отримаємо помилку
    this.timeout(12000);
    console.log(ln + "Started");
    // очікуємо доки звільниться порт
    await dummy(2000);
    console.log(ln + "Pause complited. iface.isOpened=" + iface.isOpened);
    while (!iface.isOpened) {
      await dummy(3000);
      console.log(ln + "Waiting. iface.isOpened=" + iface.isOpened);
    }
    console.log(ln + "==== connection established ======");
    //this.timeout(2000);
    //this.timeout(2000);
    return 1;
  });

  it("read Bad devAddr of RS485", async () => {
    assert.rejects(
      async () => {
        let res = await driver.getRegPromise({
          iface,
          devAddr: 77,
          regName: "state",
        });
      },
      { code: 13 }
    );
  });
  it("read Bad regName", async () => {
    assert.rejects(
      async () => {
        let res = await driver.getRegPromise({
          iface,
          devAddr: 1,
          regName: "wrongState",
        });
      },
      { code: 13 }
    );
  });

  describe('testing register "state"', () => {
    let curState = 0,
      req = {
        iface,
        devAddr: addr,
        regName: "state",
      };
    it("read current State", async () => {
      //this.timeout(5000);
      //console.dir(this);
      let res = await driver.getRegPromise(req);
      assert.equal(
        res[0].regName,
        "state",
        `Error must be res[0].regName='state' `
      );
      assert.notEqual(
        res[0].value,
        undefined,
        `Error must be res[0].regName='state' `
      );
      curState = res[0].value;
      // console.log(`res[0]`);
      // console.dir(res);
      //done();
      return 1;
    });
    it('change "state" to "start" send 17', async () => {
      req.value = 17;
      let res = await driver.setRegPromise(req);
      assert.equal(res.value, 17, "Must be res.value = 17");
      res = await driver.getRegPromise(req);
      // console.log(`res=`);
      // console.dir(res);
      assert.equal(
        res[0].value,
        23,
        `Readed state must be 23 baut res.value = "${res.value}"`
      );
      // console.log(`res=`);
      // console.dir(res);
    });
    it('change "state" to "stop" send 1', async () => {
      let r = { ...req };
      r.value = 1;
      // console.log(`r=`);
      // console.dir(r, { depth: 1 });
      let res = await driver.setRegPromise(r);
      assert.equal(res.value, 1, "Must be res.value = 1");
      res = await driver.getRegPromise(r);
      assert.equal(
        res[0].value,
        7,
        `Readed state must be 7 baut res.value = "${res.value}"`
      );
    });
  });

  describe('testing 10 times read register "T"', async () => {
    let req = { iface, devAddr: addr, regName: "T" },
      n = 10;
    this.timeout(12000);
    it(`${n}` + " times reading 'T' ", async () => {
      let res = "";
      for (let i = 0; i < n; i++) {
        let data = await driver.getRegPromise(req);
        assert.equal(data[0].regName, "T");
        assert.notEqual(data[0].value, undefined);
        res += data[0].value + "; ";
      } //for
      console.log("Received:" + res);
    }).timeout(n * 2000);
  });
});
