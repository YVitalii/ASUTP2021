const LogWriter = require('./classLogWriter.js');
const config = require('../config.js');
const getDate = require('../tools/general.js').getDateString;
const server = require('../rs485/RS485_driver_get.js'); // клиент
//console.log("__dirname="+__dirname);
var loggers={};
for (var i = 0; i < config.entities.length; i++) {
  // перебираем все печи в списке и создаем для них записыватели
  let furnace=config.entities[i];
  let path=config.logger.path+'/'+furnace.id; // путь к архиву furnace
  loggers[furnace.id]=new LogWriter ({"path":path, "listRegs":furnace.listLogRegs,"server":server});
}
//console.dir(loggers);
