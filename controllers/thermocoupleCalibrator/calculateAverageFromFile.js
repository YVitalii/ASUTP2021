const { open } = require("node:fs/promises");
const AverageCalculator = require("./calculateAverage.js");
const gLn = __filename + "::";
const { resolve } = require("path");

// console.log(gLn + "require.main");
// console.dir(require.main);

async function calculateAverage(fName, timeLaps = {}) {
  let startTime = new Date(timeLaps.start ? timeLaps.start : 0).getTime();
  let endTime = new Date(timeLaps.end ? timeLaps.end : new Date()).getTime();
  fName = resolve(fName);
  let trace = 0,
    ln = `calculateAverage(${fName})::`;
  trace
    ? console.log(
        ln,
        `TimeLaps: from ${new Date(startTime).toLocaleString()} to ${new Date(
          endTime
        ).toLocaleString()}`
      )
    : null;
  let lines = -1;
  let headers = [],
    calculators = [];
  try {
    const file = await open(fName, "r");

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
      res[headers[i]] = calculators[i].getAverage().toFixed(1);
    }
    // trace ? console.log(ln + `Calculators:`, calculators) : null;
    if (trace) {
      log("i", ln, `res=`);
      console.dir(res);
      console.table(res);
    }

    return res;
  } catch (error) {
    console.error(`Error reading file ${fName}:`, error);
  }
  return null;
} // calculateAverage

async function calculateMany(arr) {
  let trace = 0,
    ln = gLn + `::calculateMany(arr)::`;
  if (typeof arr != "object") {
    console.error(ln + "Incoming data must be an object!");
  }
  let resArr = [];
  for (const key in arr) {
    if (Object.prototype.hasOwnProperty.call(arr, key)) {
      const element = arr[key];
      trace
        ? console.log(
            ln +
              `element={fName:"${element.fName}",timeLaps:{start:"${element.timelaps.start}", end:"${element.timelaps.end}"}}`
          )
        : null;
      let res = await calculateAverage(element.fName, element.timelaps);
      if (trace) {
        console.log("i", ln, `res=`);
        console.dir(res);
      }
      resArr.push(res);
    } // if(object..)
  } // for
  if (trace) {
    console.log(ln + `resArr=`);
    console.table(resArr);
  }
  return resArr;
}

module.exports = { calculateAverage, calculateMany };

if (require.main === module) {
  let homeDir = "E:/node/ASUTP2021/tests/testEntity/loggerManager/";
  let arr = {
    100: {
      fName: homeDir + "2025-08-06_10-32.log",
      timelaps: { start: "2025-08-06; 10:45:00", end: "2025-08-06; 11:05:00" },
    },
    220: {
      fName: homeDir + "2025-08-06_10-32.log",
      timelaps: { start: "2025-08-06; 12:10:00", end: "2025-08-06; 12:55:00" },
    },
    340: {
      fName: homeDir + "2025-08-06_13-00.log",
      timelaps: { start: "2025-08-06; 14:20:00", end: "2025-08-06; 14:55:00" },
    },
    590: {
      fName: homeDir + "2025-08-06_13-00.log",
      timelaps: { start: "2025-08-06; 16:15:00", end: "2025-08-06; 16:40:00" },
    },
    1080: {
      fName: homeDir + "2025-08-06_13-00.log",
      timelaps: { start: "2025-08-06; 18:10:00", end: "2025-08-06; 18:35:00" },
    },
  };
  (async () => {
    let result = await calculateMany(arr);
    console.table(result);
  })();

  // calculateAverage(homeDir + "t360.log", {
  //   start: "2025-08-06; 14:35:00",
  //   end: "2025-08-06; 14:55:00",
  // });
}
