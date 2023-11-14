const router = require("./routes/router");
const pug = require("pug");
let process = {};
process.router = router;
process.htmlFull = (entity) => {
  return pug.renderFile(__dirname + "/views/process_full.pug", {
    entity: entity,
  });
};

module.exports = process;
