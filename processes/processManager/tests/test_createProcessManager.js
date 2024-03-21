const ClassProcessManager = require("../ClassProcessManager");

let procManager = new ClassProcessManager({
  tasksManager: {},
  homeDir: "/tests/",
  homeUrl: "/tests",
});

if (!module.parent) {
  console.log(`----- procManager at ${new Date().toLocaleTimeString()}} =====`);
  console.dir(procManager, { depth: 3 });
  procManager.getFullHtml({ lang: "ua" });
}
