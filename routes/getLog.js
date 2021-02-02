var express = require('express');
var router = express.Router();
// ------------ логгер  --------------------
let l = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)
gTrace ?  l('i',logName) : null;
// ---------------
/* GET users listing. */
router.post('/', function(req, res, next) {
  res.send('respond with a resource: Logs');
});

module.exports = router;
