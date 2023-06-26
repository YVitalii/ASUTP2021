var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js
const akon = require("../devices/WAD-MIO-MAXPro-645/driver.js");
const iface = require(".././rs485/RS485_v200.js");

/* GET akon page. */
router.get('/', function(req, res, next) {
  let userData = req.user
  console.log("UserData: ", userData);
  res.render('akon', { entities: config.entities, userData });
});

/** POST Отримання поточного стану  */
router.post("/getState", function (req, res, next) {
  let state = null;
  let id = 1;
  akon.getReg(iface, id, "SN", (err, data) => {
    console.log(`akon.js getState => data: ${JSON.stringify(data)}`);
    state = data;
    res.json({ err: null, data: state });
  });
});

module.exports = router;