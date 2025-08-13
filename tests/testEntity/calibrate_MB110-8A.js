const {
  calculateMany,
} = require("../../controllers/thermocoupleCalibrator/calculateAverageFromFile.js");

const gLn = __filename + "::";
const { resolve } = require("path");
const { open, writeFile } = require("node:fs/promises");
async function writeCalibrationFile(args = {}, toFile = "") {
  let trace = 1,
    ln = gLn + `writeCalibrationFile(${toFile})::`;
  let result = await calculateMany(args);
  for (let i = 0; i < result.length; i++) {
    const row = result[i];
    delete row["tT"];
    delete row["Tf"];
    for (let col = 1; col < 9; col++) {
      let reg = `dT${col}`;
      row[reg] = (row[reg] / 10).toFixed(1);
    } // for col
  } // for (i=)
  console.table(result);
  let fName = resolve(toFile);
  try {
    // let res = {};
    // for (let i = 0; i < result.length; i++) {
    //   let row = result[i];
    //   res[row.T0] = row;
    //   delete row.T0;
    // }
    const file = await open(fName, "w");
    await file.writeFile(JSON.stringify(result));
    if (trace) {
      console.log("i", ln, `result=`);
      console.dir(result);
    }
    console.log(`File: ${fName} writed successfully!`);
  } catch (error) {
    console.error(error);
  }
} // function writeCalibrationFile

//console.dir(require.main);

if (require.main === module) {
  let homeDir = "./loggerManager/";
  let arr = {
    21: {
      fName: homeDir + "2025-08-11_13-43.log",
      timelaps: { start: "2025-08-11; 13:44:00", end: "2025-08-11; 13:59:00" },
    },
    80: {
      fName: homeDir + "2025-08-11_14-05.log",
      timelaps: { start: "2025-08-11; 15:30:00", end: "2025-08-11; 16:10:00" },
    },
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
      timelaps: { start: "2025-08-06; 18:20:00", end: "2025-08-06; 18:32:00" },
    },
  };
  (async () => {
    await writeCalibrationFile(arr, "./MB110_CalibrationFile.json");
  })();
}
