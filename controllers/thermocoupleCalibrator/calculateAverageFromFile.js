const { open } = require("node:fs/promises");
const AverageCalculator = require("./calculateAverage.js");

async function calculateAverage(fName, timeLaps = {}) {
  let startTime = new Date(timeLaps.start ? timeLaps.start : 0).getTime();
  let endTime = new Date(timeLaps.end ? timeLaps.end : new Date()).getTime();
  let trace = 0,
    ln = `calculateAverage(${fName})::`;
  console.log(
    ln,
    `TimeLaps: from ${new Date(startTime).toLocaleString()} to ${new Date(
      endTime
    ).toLocaleString()}`
  );
  let lines = -1;
  let headers = [],
    calculators = [];
  try {
    const file = await open(fName);

    for await (const line of file.readLines({ encoding: "utf8" })) {
      let arr = line.trim().split("\t");
      lines++;
      //   trace ? console.log(ln + `arr=`, arr) : null;
      if (lines === 0) {
        // перший рядок з заголовком
        // trace ? console.log(ln + `Headers line found:`, arr) : null;
        for (let i = 0; i < arr.length; i++) {
          headers[i] = arr[i].trim();
          calculators[i] = new AverageCalculator({ id: headers[i] });
        }
        trace ? console.log(ln + `Headers:`, headers) : null;
        // trace ? console.log(ln + `Calculators:`, calculators) : null;
        continue; // пропускаємо перший рядок
      }

      // обробка рядків з даними
      let recTime = new Date(arr[0].trim()).getTime();
      if (recTime < startTime || recTime > endTime) {
        continue; // пропускаємо рядки поза межами часових рамок
      }
      for (let i = 1; i < arr.length; i++) {
        calculators[i].addValue(parseFloat(arr[i].trim()));
      }

      // console.log(line);
    } // for await (const line of file.readLines({ encoding: "utf8" }))
    let res = {};
    for (let i = 1; i < headers.length; i++) {
      res[headers[i]] = (calculators[i].getAverage() / 10).toFixed(1);
    }
    // trace ? console.log(ln + `Calculators:`, calculators) : null;
    console.table(res);
    return res;
  } catch (error) {
    console.error(`Error reading file ${fName}:`, error);
  }
  return null;
} // calculateAverage

module.exports = calculateAverage;

if (!module.parents) {
  calculateAverage("./tests/data/t360.log", {
    start: "2025-08-05; 14:35:00",
    end: "2025-08-05; 15:20:00",
  });
}
