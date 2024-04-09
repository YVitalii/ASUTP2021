const entity = require("../../../tests/testEntity/entity.js");

module.exports = entity.processManager;

if (!module.parent) {
  console.log(`----- procManager at ${new Date().toLocaleTimeString()}} =====`);
  console.dir(entity.processManager, { depth: 1 });
  //procManager.getFullHtml({ lang: "ua" });
}
