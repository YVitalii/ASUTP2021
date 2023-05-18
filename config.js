const config = {};
config.ipAddr = "192.168.1.143"; // IP адреса в локальній мережі
const TRP08 = require("./devices/trp08/manager.js");
const ThermProcess = require("./processes/thermprocess/ThermProcess.js");
const iface = require("./rs485/RS485_v200.js");

// включает/выключает  эмуляцию обмена по RS485
config.emulateRS485 = 0; //true;

// загружает настройки связи
config.connection = require("./conf_iface.js");
// ------------------- описание печей (сущностей) ------------------------
let entities = [];

entities.push({
  id: "SDO-151515-55",
  shortName: "СДО-15.15.15/5,5ВЦ", //
  fullName: "Електропіч СДО-15.15.15/5,5ВЦ", //
  temperature: { min: 0, max: 600 }, // диапазон рабочих температур
  regs: {
    "1-tT": {
      title: "SP", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Задана температура",
      legend: "Завдання", // Надпись для графика
    },
    "1-T": {
      title: "T", // имя для вывода в описании поля
      type: "integer",
      units: "\u00b0C",
      description: "Поточна температура",
      legend: "Температура", // Надпись для графика
    },
  }, //regs
  listRegs: "1-tT;1-T", // список регистров для запроса, что бы их не генерировать каждый раз
  devicesList: [new TRP08(iface, 1, { addT: 0 })], //список приладів печі
});
// костиль з термопроцессом
entities[0].thermProcess = new ThermProcess(entities[0].devicesList);

config.entities = entities;

// таблица сопоставления адреса устройства и типа (массив где индекс - адрес устройства, а значение - имя файла драйвера)
config.devices = [
  "all", //0
  "TRP08", //1
];
// список используемых алиасов с указанием физического имени регистра
// (т.е. адрес ModBus + сигнатура в драйвере устройства, например 7SQ1 => 5-DIO1 )
var tags = new Map();
tags.set("T1", "1-T");
tags.set("SP1", "1-tT");

config.tags = tags;
//tags.set("sT"+i,i+"-T");
// настройки логгера
config.logger = {
  path: __dirname + "/public/logs",
  period: 20, // период между записями 30 секунд
  separator: "\t", // разделитель значений в строке
  deviation: -1, //  коридор нечуствительности изменения температуры,
  //  т.е. если предыдущее и последующие значения отличаются менее чем на deviation сек,
  //  запись в файл не делается.
  errValue: -20, // записывается в лог-файл если ошибка
};

// ------------  очереди опроса  -----------------------
config.queue = {};
// рабочая очередь опроса, опрашивается автоматически в цикле
//  актульным считается значение,если оно считано не более 5 сек назад
config.queue.work = ["1-T", "1-tT"];

module.exports = config;

if (!module.parent) {
  console.dir(config, { depth: 4 });
  console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
