const { resolve } = require("path");
const { open } = require("node:fs/promises");
const dummy = require("../../tools/dummy.js").dummyPromise;
let baseDir = resolve("../../tests/testEntity");
let inFileName = resolve(baseDir, "loggerManager", "2025-08-06_13-00.log");
let outFileName = resolve(
  baseDir,
  "loggerManager",
  "2025-08-08_calibrated.log"
);
let calibrationFile = resolve(baseDir, "MB110_CalibrationFile.json");
let gLn = __dirname + "::";
const CalibratorClass = require("./CorrectValueClass");

console.log(
  gLn + `Started:\ninFileName=${inFileName};\ninFileName=${outFileName}`
);
async function go() {
  let trace = 1,
    ln = gLn + `go()::`;

  let calibrator = new CalibratorClass(calibrationFile, "T0");
  while (!calibrator.ready) {
    await dummy(3000);
  }

  let inFile, outFile;
  let lines = -1;
  let headers = [];

  try {
    inFile = await open(inFileName, "r");
    outFile = await open(outFileName, "w");
  } catch (error) {
    console.error(`Error opening file:`, error);
  }

  for await (const line of inFile.readLines({ encoding: "utf8" })) {
    let arr = line.trim().split("\t");
    lines++;
    let res = arr[0] + "\t" + arr[1] + "\t" + arr[2] + "\t" + arr[3];
    if (lines === 0) {
      // перший рядок з заголовком
      //   trace ? console.log(ln + `Headers line found:`, arr) : null;
      for (let i = 0; i < arr.length; i++) {
        headers[i] = arr[i].trim();
      }
      trace ? console.log(ln + `Headers:`, headers) : null;
      let headersLine = res;
      for (let i = 4; i < headers.length; i++) {
        let el = arr[i];
        headersLine += `\t ${el.slice(1)} \t ${el}`;
      }
      trace ? console.log(ln + `headersLine=${headersLine}`) : null;
      outFile.write(headersLine + "\n");
      // trace ? console.log(ln + `Calculators:`, calculators) : null;
      continue; // пропускаємо перший рядок
    } // if (lines === 0)

    for (let i = 4; i < arr.length; i++) {
      trace = 1;
      let regName = `dT${i - 3}`;
      const el = parseFloat(arr[i]);
      let t = arr[3] - parseFloat(el) / 10;

      let calibratedT = calibrator.calibrate(regName, t);
      res += "\t" + calibratedT.toFixed(1);
      let calibrated_dT = parseFloat(arr[3]) - calibratedT;
      res += "\t" + calibrated_dT.toFixed(1);
      trace
        ? console.log(
            ln +
              `regName=${regName};el=${el}; calibratedT=${calibratedT}; calibrated_dT=${calibrated_dT}; `
          )
        : null;
    }
    outFile.write(res + "\n");
  } //for await
  inFile.close();
  outFile.close();
} // async function go()

go();
