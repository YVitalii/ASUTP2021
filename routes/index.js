var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js
console.log("config.entities:");
console.log(config.entities);

/* GET home page. */
router.get('/', function(req, res, next) {
  let userData = req.user
  console.log("UserData: ", userData);
  res.render('index', { entities: config.entities, userData });
});

module.exports = router;
// some changes
