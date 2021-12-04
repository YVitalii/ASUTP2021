var assert = require("assert");
var TRP08 = require("../simulator.js");
const log = require("../../../tools/log.js");
// ------------ логгер  --------------------
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
// ----------- настройки логгера локальные --------------

var trp;
before((done) => {
  log("i", "---------- Before() ----------");
  trp = new TRP08({
    pow: 30,
    kLoss: 25,
    furnaceC: 35,
    ogr: 9,
  });
  log("i", logName, " trp= ", trp);
  done();
});

// after((done) => {
//   log("i", "------------- After() ----------");
//   trp = null;
//   done();
// });

describe("Change parameters", function () {
  it("Change taskT", () => {
    let t = 100;
    trp.taskT = t;
    assert.equal(trp.taskT, t);
  });

  it("Change heating time H", function () {
    let h = 60;
    trp.H = h;
    assert.equal(trp.H, h);
  });

  it("Change holding time Y", function () {
    let y = 30;
    trp.Y = y;
    assert.equal(trp.Y, y);
  });

  it("Change mode", function () {
    trp.mode = 1;
    assert.equal(trp.mode, 1);
    assert.equal(trp.state, "startHeating");
    trp.mode = 0;
    assert.equal(trp.mode, 0);
    assert.equal(trp.state, "startWaiting");
    trp.mode = 100;
    assert.equal(trp.mode, 1);
    assert.equal(trp.state, "startHeating");
    trp.mode = -1;
    assert.equal(trp.mode, 0);
    assert.equal(trp.state, "startWaiting");
  });
}); // describe("Change parameters"

describe("Test processes", function () {
  log("i", logName, " trp= ", trp);
  //trp.H = 30;
  it("start heating", () => {
    log("i", "startHeating");
    trp.H = 30;
    trp.mode = 1;
  });
}); //describe("test processes",
