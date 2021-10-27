//const rs485 = require("./rs485/RS485_server.js");
const config = {};
// включает/выключает  эмуляцию обмена по RS485
config.emulateRS485 = 1; //true;
// ------ список приборов в сети RS485 ------
config.devices = ["all", "TRP08", "TRP08", "TRP08", "TRP08", "WAD-DIO24"];
// загружает настройки связи
config.connection = require("./conf_iface.js");
// -------------- описание печей (сущностей) ------------------------
let entities = [];
entities.push(require("./furnaces/SDO-16-45-12/description.js"));
//console.log("rs485=");
//console.dir(rs485);
config.entities = entities;
// настройки логгера
config.logger = {
  path: __dirname + "/public/logs",
  period: 20, // период между записями 30 секунд
  separator: "\t", // разделитель значений в строке
  deviation: 2, //  коридор нечуствительности изменения температуры,
  //  т.е. если предыдущее и последующие значения отличаются менее чем на 2 С,
  //  запись в файл не делается.
  errValue: -20, // записывается в лог-файл если ошибка
};

// ------------  очереди опроса  -----------------------
config.queue = {};
// рабочая очередь опроса, опрашивается автоматически в цикле
//  актульным считается значение,если оно считано не более 5 сек назад
config.queue.work = [
  "1-T",
  "2-T",
  "3-T",
  "4-T",
  "1-state",
  "2-state",
  "3-state",
];

module.exports = config;

if (!module.parent) {
  //console.dir(config, { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
