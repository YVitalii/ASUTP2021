//  nodemon --exec "mocha ./devices/furnaceModel/tests -c" -w "./devices/furnaceModel" -w "./devices/furnaceModel/tests"

var assert = require("assert");
var Furnace = require("../simulator.js");
const log = require("../../../tools/log.js");
// ------------ логгер  --------------------
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
// ----------- настройки логгера локальные --------------
/**
 * Конструктор класса
 * @param {object} [options={}] список настроечных параметров печи/зоны
 * @param {number} [options.heatersPow=30] мощность нагревателей печи/зоны, кВт
 * @param {number} [options.heatersWeight=25] вес нагревателей, кг
 * @param {number} [options.furnaceWeight=300] вес футеровки, кг
 * @param {number} [options.loadingWeight=20] вес садки, кг
 */

var furnace;
before((done) => {
  log("i", "---------- Before() ----------");
  furnace = new Furnace({
    heatersPow: 35,
    heatersWeight: 30,
    furnaceWeight: 100,
    loadingWeight: 20,
  });

  done();
});

// after((done) => {
//   log("i", "------------- After() ----------");
//   trp = null;
//   done();
// });

describe("Check parameters", function () {
  it("Change taskT", () => {
    log("i", logName, " furnace= ", furnace);
  });

  it("Change heating time H", function () {
    for (var i = 0; i < 100; ++i) {
      furnace.heat();
      console.log(furnace.heaters.t);
    }
  });

  //   it("Change holding time Y", function () {
  //     let y = 240;
  //     trp.Y = y;
  //     assert.equal(trp.Y, y);
  //   });

  //   it("Change mode", function () {
  //     trp.mode = 1;
  //     assert.equal(trp.mode, 1);
  //     assert.equal(trp.state, "startHeating");
  //     trp.mode = 0;
  //     assert.equal(trp.mode, 0);
  //     assert.equal(trp.state, "startWaiting");
  //     trp.mode = 100;
  //     assert.equal(trp.mode, 1);
  //     assert.equal(trp.state, "startHeating");
  //     trp.mode = -1;
  //     assert.equal(trp.mode, 0);
  //     assert.equal(trp.state, "startWaiting");
  //   });
}); // describe("Change parameters"

// describe("Test processes", function () {
//   log("i", logName, " trp= ", trp);
//   //trp.H = 30;
//   it("start heating", () => {
//     log("i", "startHeating");
//     trp.H = 30;
//     trp.mode = 1;
//   });
// }); //describe("test processes",
