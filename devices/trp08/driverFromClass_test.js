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

  it("read State", async () => {
    //this.timeout(5000);
    //console.dir(this);
    let res = await driver.getRegPromise({ iface, id: addr, regName: "state" });
    console.log("res=");
    console.dir(res);
    //done();
    return 1;
  });
});
