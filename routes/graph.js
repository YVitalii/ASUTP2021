var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js
let thisFurnace = {};

/* GET graph page. */
router.get('/:furnace', function(req, res, next) {
  let userData = req.user
  console.log("UserData: ", userData);
  config.entities.forEach(furnace => {
    console.log(furnace);
    if (req.params.furnace == furnace.id) {
		  thisFurnace = furnace;
    }
  });
  res.render('graph', {furnace: thisFurnace, userData});
});

module.exports = router;