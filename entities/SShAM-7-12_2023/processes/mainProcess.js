const router = require("./routes/router");
const pug = require("pug");
let process = {};
process.router = router;
process.fullHTML = () => {
  return pug.renderFile(__dirname + "/views/process_full.pug");
};

module.exports = process;
