const LogWriter = require('./classLogWriter.js');
const config = require('../config.js');
//console.log("__dirname="+__dirname);
var loggers={};
for (var i = 0; i < config.entities.length; i++) {
  let furnace=config.entities[i];
  let path=config.logger.path+'/'+furnace.id; // путь к архиву furnace
  loggers[furnace.id]=new LogWriter (path, furnace.listRegs);
}
console.dir(loggers);
