var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js
const fs = require('fs');
let thisFurnace = {};

/* GET report page. */
router.get('/:furnace', function(req, res, next) {
  const id = req.params.furnace;
  config.entities.forEach(furnace => {
    if (id == furnace.id)
		thisFurnace = furnace;
  });
  const path = "../ASUTP2021/public/logs/"+id;
  let fileList = [];
  fs.readdirSync(path).forEach(file => {
      fileList.push(file);
  });
  res.render('report', {furnace: thisFurnace, fileList: fileList});
});

module.exports = router;