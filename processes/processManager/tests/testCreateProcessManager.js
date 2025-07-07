const entity = require("../../../tests/testEntity/entity.js");

module.exports = entity.processManager;

if (!module.parent) {
  console.log(
    `----- processManager at ${new Date().toLocaleTimeString()}} =====`
  );
  console.dir(entity.processManager, { depth: 2 });
  //procManager.getFullHtml({ lang: "ua" });
}
