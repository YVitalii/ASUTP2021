const log = require("../../tools/log");

class AverageCalculator {
  constructor(props = {}) {
    this.id = props.id || "id";
    this.ln = `AverageCalculator(${this.id})::`;
    this.accumulator = 0;
    this.count = 0;
  }
  addValue(value) {
    let trace = 0,
      ln = this.ln + `addValue(${value})::`;
    if (trace) {
      log("i", ln, `Adding value: ${value}`);
    }
    if (value === undefined || value === null || isNaN(value)) {
      throw new Error(ln + "Invalid value provided for averaging.");
    }
    this.accumulator += value;
    this.count++;
  }
  getAverage() {
    let trace = 0,
      ln = this.ln + `getAverage()::`;
    if (this.count === 0) {
      throw new Error(this.ln + "No values to calculate average.");
    }
    trace
      ? log(
          "i",
          this.ln,
          `Calculating average: accumulator=${this.accumulator}, count=${this.count}`
        )
      : null;
    return this.accumulator / this.count;
  }
}

module.exports = AverageCalculator;

if (!module.parent) {
  let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let avgCalc = new AverageCalculator({ id: "testAvgCalc" });
  arr.forEach((value) => {
    avgCalc.addValue(value);
  });
  console.log(`Average of ${arr} is: ${avgCalc.getAverage()}`);
}
