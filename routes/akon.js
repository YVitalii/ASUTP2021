var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js

/* GET akon page. */
router.get('/', function(req, res, next) {
  let userData = req.user
  console.log("UserData: ", userData);
  res.render('akon', { entities: config.entities, userData });
});

module.exports = router;