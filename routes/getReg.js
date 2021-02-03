var express = require('express');
var router = express.Router();
// ------------ логгер  --------------------
let log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=1; //=1 глобальная трассировка (трассируется все)
gTrace ?  log('i',logName) : null;

// ---------------
/* GET users listing. */
router.post('/', function(req, res, next) {
  // -- настройки логгера --------------
   let trace=1;
   let logN=logName+"POST:/getReg => ";
   trace = ((gTrace !== 0) ? gTrace : trace);
  //-------------------------------------
   trace ? log('i',logN,"req=", req.query) : null;
  let list=req.query.list.trim().split(";");
  trace ?  log('i',logN,"list=",list) : null;
  let addr=1;
  let response={}
  for (var i = 0; i < list.length; i++) {
     addr=parseInt(list[i].split('-')[0]);
     trace ?  log('i',logN,"addr=",addr) : null;
     response[list[i]]=emulator(addr);
  }
  res.json(response);
});

module.exports = router;

//
const start = new Date().getTime()//-2*60*1000;
function emulator(addr) {

  // функция отвечает на запросі ємулирую физические величины
  let max=300; //максимальная температура
  let min=20; //минимальная температрура
  let period=(3*60*1000)*addr; //длительность периода колебаний (3 минут * addr)
  let x=(new Date().getTime()-start)/period; // текущий х
  let y=Math.sin(x)*(max-min)/2 + (max-min)/2;
  console.log("addr=",addr,"; x=",x,"; y=",y,";start=",start);
  return Math.round(y)
}
