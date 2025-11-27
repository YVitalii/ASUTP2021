//  nodemon --exec "mocha ./devices/TRP08/test -c" -w "./devices/TRP08" -w "./devices/TRP08/tests"

var assert = require("assert");
var TRP08 = require("../simulator_deviceClass.js");
const log = require("../../../tools/log.js");
// ------------ логгер  --------------------
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
// ----------- настройки логгера локальные --------------
var trp;
log("w", "------------- TRP08 --------------");
console.dir(TRP08);
before((done) => {
  log("i", "---------- Before() ----------");
  trp = new TRP08({
    pow: 35,
    kLoss: 50,
    furnaceC: 35,
    ogr: 3,
    o: 5,
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
    let t = 60;
    trp.taskT = t;
    assert.equal(trp.taskT, t);
  });

  it("Change heating time H", function () {
    let h = 60;
    trp.H = h;
    assert.equal(trp.H, h);
  });

  it("Change holding time Y", function () {
    let y = 240;
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
