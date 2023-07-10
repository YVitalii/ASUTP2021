const config = {};
config.ipAddr = "192.168.1.147"; // IP адреса в локальній мережі
const TRP08 = require("./devices/trp08/manager.js");
const EM_07K = require("./devices/EM-07K/manager.js");
// const Akon = require("./devices/WAD-MIO-MAXPro-645/manager.js");
const ThermProcess = require("./processes/thermprocess/ThermProcess.js");
const iface = require("./rs485/RS485_v200.js");

// включает/выключает  эмуляцию обмена по RS485
config.emulateRS485 = 0; //true;

// загружает настройки связи
config.connection = require("./conf_iface.js");
// ------------------- описание печей (сущностей) ------------------------
let entities = [];

entities.push({
  id: "SDO-205020-55",
  shortName: "СДО-20.50.20/5,5ВЦ", //
  fullName: "Електропіч СДО-20.50.20/5,5ВЦ", //
  temperature: { min: 0, max: 550 }, // диапазон рабочих температур
  regs: {
    "2-tT": {
      title: "SP1", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Задана температура зони №1",
      legend: "Завдання зони №1", // Надпись для графика
    },
    "2-T": {
      title: "T1", // имя для вывода в описании поля
      type: "integer",
      units: "\u00b0C",
      description: "Поточна температура зони №1",
      legend: "Температура зони №1", // Надпись для графика
    },
    "3-tT": {
      title: "SP2", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Задана температура зони №2",
      legend: "Завдання зони №2", // Надпись для графика
    },
    "3-T": {
      title: "T2", // имя для вывода в описании поля
      type: "integer",
      units: "\u00b0C",
      description: "Поточна температура зони №2",
      legend: "Температура зони №2", // Надпись для графика
    },
  }, //regs
  listRegs: "2-tT;2-T;3-tT;3-T", // список регистров для запроса, что бы их не генерировать каждый раз
  // listRegs: "1-CTR;1-VTR;2-tT;2-T;3-tT;3-T", // список регистров для запроса, что бы их не генерировать каждый раз
  devicesList: [
    // new EM_07K(iface, 1),
    new TRP08(iface, 2, { addT: 0 }),
    new TRP08(iface, 3, { addT: 0 }),
    // new Akon(iface, 1)
  ], //список приладів печі
});
// костиль з термопроцессом
entities[0].thermProcess = new ThermProcess(entities[0].devicesList);

config.entities = entities;

// таблица сопоставления адреса устройства и типа (массив где индекс - адрес устройства, а значение - имя файла драйвера)
config.devices = [
  "all", //0
  "EM-07K", //1
  "trp08", //2
  "trp08", //3
];
// список используемых алиасов с указанием физического имени регистра
// (т.е. адрес ModBus + сигнатура в драйвере устройства, например 7SQ1 => 5-DIO1 )
var tags = new Map();
tags.set("T1", "2-T");
tags.set("SP1", "2-tT");
tags.set("T2", "3-T");
tags.set("SP2", "3-tT");

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
config.queue.work = ["2-T", "2-tT", "3-T", "3-tT"];
// config.queue.work = ["1-CTR", "1-VTR", "2-T", "2-tT", "3-T", "3-tT"];

module.exports = config;

if (!module.parent) {
  console.dir(config, { depth: 4 });
  console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
