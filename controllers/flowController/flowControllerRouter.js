var express = require("express");
const router = express.Router();

router.post("/", (req, res, next) => {
  let trace = 1,
    ln = this.ln + "router().post(/getAllRegs)";
  console.log(ln, "ln");
  res.send("ln");
  return 1;
});

module.exports = router;
