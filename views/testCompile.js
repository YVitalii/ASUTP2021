const pug = require("pug");
const fs = require("fs");
const { normalize, resolve } = require("path");
function testCompile(pugFilePath = "", options = {}) {
  if (pugFilePath == "") throw new Error("No pug file path specified");
  let fH;
  let htmlFilePath = resolve(normalize(pugFilePath.replace(/\.pug$/, ".html")));
  console.log("pugFilePath: " + pugFilePath);
  let compiledHtml = pug.compileFile(pugFilePath)(options);
  fH = fs.openSync(htmlFilePath, "w+");
  fs.writeSync(fH, compiledHtml);
  fs.closeSync(fH);
  console.log("Wrote " + htmlFilePath);
}
// let options = { lang: "ua", pageTitle: "Test" };

module.exports = testCompile;
