//  mocha "./test/test_simulator.js" -w --watch-list ["./"] -c --node

// ------------ логгер  --------------------
const log = require("../../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;
// trace ? log("i",logN,"--- ---") : null;
// trace ? console.dir() : null;

let assert = require("assert");
let DevSim = require("../simulator.js");

console.log("------ start tests -------------");

before((done) => {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "before():";
  let trace = 1;
  trace = gTrace != 0 ? gTrace : trace;
  trace ? log("i", logN, "----->  Started") : null;
  // trace ? log("i",logN,"--- ---") : null;
  // trace ? console.dir() : null;
  dev = new DevSim({
    ogr: 6,
    o: 5,
    furnace: {
      furnaceMaxLoss: 25,
      furnaceMaxT: 500,
    },
  });
  trace ? log("i", logN, "--- dev ---") : null;
  trace ? console.dir(dev) : null;
  setTimeout(function () {
    done();
  }, 1000);
});

describe("test has()", function () {
  let arr = [
    ["T", true],
    ["tT", true],
    ["H", true],
    ["Y", true],
    ["o", true],
    ["state", true],
    ["badReg", false],
  ];
  for (let i = 0; i < arr.length; i++) {
    let [regName, value] = arr[i];
    it(`has(${regName})=${value}`, function () {
      assert.equal(dev.has(regName), value);
    });
  } //for
}); //

describe("Тестирование setReg(iface, id, regName, value, cb)", function () {
  // it("", function (done){
  //     dev.setReg(null,1,"",?,done);
  // })
  let arr = [
    ["Установка задания температуры.", "tT", 333],
    ["Установка времени нарастания.", "H", 111],
    ["Установка времени удержания.", "Y", 222],
    ["Установка рассогласования.", "o", 3],
    ["Пуск прибора.", "state", 1],
    ["Стоп прибора.", "state", 0],
  ];
  console.dir(arr);
  for (let i = 0; i < arr.length; i++) {
    let [msg, regName, value] = arr[i];
    log("w", `msg=${msg}; regName=${regName}; value=${value}`);
    it(`setReg: ${msg} ${regName} => ${value}`, function (done) {
      dev.setReg(null, 1, regName, value, (err, data) => {
        if (err) done(err);
        if (data[0].value == value) done();
      });
    }); //it
    it(`getReg: ${msg} ${regName} = ${value}`, function (done) {
      dev.getReg(null, 1, regName, (err, data) => {
        if (err) done(err);
        if (data[0].value == value) done();
      });
    }); //it
  }

  //   it("Попытка установить текущую температуру: Т => 111", function (done) {
  //     dev.setReg(null, 1, "T", 111, (err, data) => {
  //       if (err) done();
  //       done(err);
  //     });
  //   });
  //   it("Установка времени удержания: Y => 222", function (done) {
  //     dev.setReg(null, 1, "Y", 222, (err, data) => {
  //       if (err) done(err);
  //       if (data[0].value == 222) done();
  //     });
  //   });

  //   it("Пуск прибора: state => 1", function (done) {
  //     dev.setReg(null, 1, "state", 1, (err, data) => {
  //       if (err) done(err);
  //       if (data[0].value == 1) done();
  //     });
  //   });
  //   it("Остановка прибора: state => 0", function (done) {
  //     dev.setReg(null, 1, "state", 0, (err, data) => {
  //       if (err) done(err);
  //       if (data[0].value == 0) done();
  //     });
  //   });
});
