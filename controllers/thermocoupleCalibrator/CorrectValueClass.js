const { resolve } = require("path");
const dummy = require("../../tools/dummy.js").dummyPromise;
const { open, existSync } = require("node:fs/promises");

const LinearFunction = require("../../tools/general.js").ClassLinearFunction;

class CorrectValue {
  constructor(fileWithCalibrationTable, baseReg) {
    this.ln = `CorrectValue(${fileWithCalibrationTable})::`;
    this.fileName = resolve(fileWithCalibrationTable);
    if (baseReg === undefined) {
      throw new Error("baseReg must be defined!!! But baseReg=${baseReg}");
    }
    this.baseReg = baseReg;
    this.ready = false;
    this.calibrationTable = {};
    this.errorCounter = 3;
    this.init();
  }
  async init() {
    let trace = 0,
      ln = this.ln + `init()::`;
    let file;
    try {
      file = await open(this.fileName, "r");

      this.calibrationTable = JSON.parse(await file.readFile());
      if (!this.calibrationTable === undefined) {
        throw new Error(
          `Base point [${this.baseReg}] not found in calibration file.`
        );
      }
      this.ready = true;
    } catch (error) {
      this.ready = false;
      console.log(ln + `errorCounter=${this.errorCounter}:`);
      console.error(error);
      this.errorCounter--;
      if (this.errorCounter === 0) {
        console.error(ln + error.message + "::Correction disabled!");
        return;
      }
      setTimeout(() => {
        this.init();
      }, 2000);
    } finally {
      file.close();
    }
  } // init()

  calibrate(regName = "", value) {
    let trace = 0,
      ln = this.ln + `calibrate(${regName},${value})::`;

    if (!this.ready || regName === this.baseReg) {
      return value;
    }

    let min = 0;
    while (+value >= +this.calibrationTable[min][this.baseReg]) {
      trace
        ? console.log(
            "i",
            ln,
            `this.calibrationTable[${min}][${this.baseReg}]=`,
            this.calibrationTable[min][this.baseReg]
          )
        : null;
      min++;
      if (min >= this.calibrationTable.length) {
        min = min - 1; // обробка виходу за діапазон зверху
        break;
      }
    } // while
    min = min == 0 ? 0 : min - 1; // обробка виходу за діапазон знизу
    let max = min + 1;
    // результат калібровки - це значення приведено до зразкового baseReg, тому y=значення базового датчика
    let y1 = +this.calibrationTable[min][this.baseReg],
      y2 = +this.calibrationTable[max][this.baseReg];
    // вхідне значення - результат вимірювання приладом що підлягає коригуванню
    // а оскільки в нас в таблиці зберігаються різниця між поточним та базовим датчиком Похибка=Т0-Тх,
    // то виміряна температура що підлягає коригуваню буде: Т0 - Похибка
    let dx1 = parseFloat(this.calibrationTable[min][regName]);
    let dx2 = parseFloat(this.calibrationTable[max][regName]);
    let x1 = y1 - dx1,
      x2 = y2 - dx2;
    if (x1 === undefined || x2 === undefined || isNaN(x1) || isNaN(x2)) {
      // console.dir(this.calibrationTable);
      throw new Error(
        ln + `Not found data for regName=${regName}: y1=${y1}; y2=${y2};`
      );
    }

    trace
      ? console.log(
          "i",
          ln,
          `min=calibrationTable[${min}]=${y1}; max=calibrationTable[${max}]=${y2};`
        )
      : null;
    trace
      ? console.log(
          ln + ` Linear function for : x1=${x1}; y1=${y1}; x2=${x2}; y2=${y2};`
        )
      : null;
    let calcFunc = new LinearFunction({ x1, y1, x2, y2 });
    if (trace) {
      console.log(ln + `calcFunc=`);
      console.dir(calcFunc);
    }
    let res = calcFunc.get(value);
    trace ? console.log(ln + `correction value=${res}`) : null;
    return res;
  } // calibrate
} // class

module.exports = CorrectValue;

if (require.main === module) {
  (async () => {
    let calibrator = new CorrectValue(
      "../../tests/testEntity/MB110_CalibrationFile.json",
      "T0"
    );
    function test(regName, value) {
      console.log(
        `regName=${regName}; value=${value.toFixed(
          1
        )}; calibratedValue=${calibrator.calibrate(regName, value).toFixed(1)}`
      );
    }
    console.dir(calibrator);
    while (!calibrator.ready) {
      console.log("calibrator not ready!");
      await dummy(2000);
    }
    let table = calibrator.calibrationTable;
    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      let regName = `dT5`;
      test(regName, row["T0"] - row[regName]);
    }
    // test("dT1", 340.5);
    // test("dT1", 588.5 + 7.8);
    // test("dT1", 1079.1 + 24.5);
  })(); //(async () => {
}
