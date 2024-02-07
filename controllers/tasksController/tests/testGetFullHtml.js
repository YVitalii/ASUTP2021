// supervisor  -w '.,./views' -e 'js,pug' --no-restart-on exit ./tests/testGetFullHtml.js
// browser-sync start --server --serveStatic '../../../public' --browser "Chrome" --files "stylesheets/*.css, *.html"
const dummy = require("../../../tools/dummy.js").dummyPromise;
const manager = require("./testCreateTaskManager.js");
const writeFile = require("fs").writeFileSync;
const pathResolve = require("path").resolve;
const homeDir = pathResolve("./tests/");
const pug = require("pug");
const mainPug = pathResolve("../../views/main.pug");
console.log("Resolved path = " + mainPug);
let fName = pathResolve(homeDir + "/index.html");
(async () => {
  await dummy(2000);
  writeFile(fName, pug.renderFile(mainPug, { body: manager.getFullHtml() }));
  console.log("File: [" + fName + "] writed!");
  fName = pathResolve(homeDir + "/tasks.json");
  writeFile(fName, JSON.stringify(manager));

  console.log("File: [" + fName + "] writed!");
  console.log(new Date().toLocaleTimeString());
})();

//  browser-sync start --server --serveStatic '../../../public' --browser "Chrome" --files "stylesheets/*.css, *.html"
