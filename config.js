const config = {};
config.ipAddr = "192.168.1.147"; // IP адреса в локальній мережі
const TRP08 = require("./devices/trp08/manager.js");
// const OWEN_MW110 = require("./devices/OWEN_MW110/manager.js");
// const EM_07K = require("./devices/EM-07K/manager.js");
// const Akon = require("./devices/WAD-MIO-MAXPro-645/manager.js");
const ThermProcess = require("./processes/thermprocess/ThermProcess.js");
const iface = require("./rs485/RS485_v200.js");
const log = require("./tools/log.js");

// включает/выключает  эмуляцию обмена по RS485
config.emulateRS485 = 0; //емуляція rs485;

config.develop = 1; // режим розробки

// трасувальник
let trace = 0;
let title = "config.js::"; // загальний підпис
let ln = title;

// загружает настройки связи
config.connection = require("./conf_iface.js");
// ------------------- описание печей (сущностей) ------------------------
let entities = [];
let homePath = "./public/logs/"; // корінь шляху до всіх архівів печей

entities.push({
  id: "SShAM-712-7", //
  shortName: "СШАМ-7.12/7", //
  fullName: "Електропіч СШАМ-7.12/7", //
  temperature: { min: 0, max: 700 }, // диапазон рабочих температур
  regs: {
    "1-tT": {
      title: "SP1", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Задана температура",
      legend: "Завдання", // Надпись для графика
    },
    "1-T": {
      title: "T1", // имя для вывода в описании поля
      type: "integer",
      units: "\u00b0C",
      description: "Поточна температура в печі",
      legend: "Температура", // Надпись для графика
    },
    "2-tT": {
      title: "SP2", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Задана температура",
      legend: "Завдання", // Надпись для графика
    },
    "2-T": {
      title: "T2", // имя для вывода в описании поля
      type: "integer",
      units: "\u00b0C",
      description: "Поточна температура в реторті",
      legend: "Температура", // Надпись для графика
    },
    // "2-state": {
    //   title: "state2", // имя для вывода в описании поля
    //   type: "integer",
    //   units: "\u00b0C",
    //   description: "Стан терморегулятора",
    //   legend: "Пуск/стоп", // Надпись для графика
    // },
  }, //regs
  listRegs: "1-tT;1-T;2-tT;2-T", // список регистров для запроса, что бы их не генерировать каждый раз
  // listRegs: "1-CTR;1-VTR;2-tT;2-T;3-tT;3-T", // список регистров для запроса, что бы их не генерировать каждый раз
  devicesList: [
    // new EM_07K(iface, 1),
    // new TRP08(iface, 1, { addT: 0 }),
    // new TRP08(iface, 3, { addT: 0 }),
    // new Akon(iface, 1)
  ], //список приладів печі
});

// кореневий шлях де зберігаються всі файли, що відносяться до даної печі наприклад:  ./public/logs/SShAM-712-7/
entities[0]["path"] = homePath + entities[0].id + `/`;

// ------------ костиль з приладами -----------------------
trace = 0;
ln = title + "entities[0].devices:";
trace ? log("i", ln, `Started`) : null;
entities[0].devices = {}; //список приладів з налаштуваннями, що встановлені в печі
let dev = entities[0].devices; // для скорочення записів
if (trace) {
  log("i", ln, `dev=`);
  console.dir(dev);
}

trace ? log("i", ln, `entities[0].devices=`, entities[0].devices) : null;
dev["furnaceTRP"] = new TRP08(iface, 1, { addT: 0 }); // терморегулятор печі
dev["retortTRP"] = new TRP08(iface, 2, { addT: 0 }); // терморегулятор в реторті

// ----------         костиль з термопроцессом  ------------------
/**  функція, що виконується перед кожним кроком програми, 
// оскільки ми регулюємо по терморегулятору що в реторті, перед запуском кроку на ньому потрібно налаштувати 
// терморегулятор печі 
*/

// додаємо терморегулятори, що приймають участь в контролі нагрівання
entities[0].thermProcess = new ThermProcess([dev["retortTRP"]], {
  homeDir: entities[0]["path"],
});

// -------------------- beforeStep --------------------------
/** ця функція виконується перед початком кожного кроку
 * @param  step - опис кроку
 */
beforeStep = async function (step) {
  // ця функція виконується перед початком кожного кроку
  let trace = 1,
    ln = this.ln + "beforeStep::";
  trace ? log("i", ln, `Started`) : null;
  // if (trace) {
  //   log("i", ln, `step=`);
  //   console.dir(step, { depth: 3 });
  // }

  // зупиняємо ТРП
  await dev["furnaceTRP"].stop();

  // встановлюємо на терморегуляторі печі на dT *С більшу температуру ніж задана в реторті
  let tT = step.tT;
  if (step.heating) {
    tT += 300;
  } else {
    tT += 50;
  }

  // перевіряємо, чи не виходить температура за обмеження в печі
  tT = tT > entities[0].temperature.max ? entities[0].temperature.max + 40 : tT;
  trace ? log("i", ln, `tT=`, tT) : null;

  // програмуємо прилад
  await dev["furnaceTRP"].setParams({
    tT: tT,
    H: 0,
    Y: 0,
    regMode: 2,
    o: 5,
  });

  // запускаємо програму
  await dev["furnaceTRP"].start();
  trace ? log("i", ln, `Finished`) : null;
};

entities[0].thermProcess.beforeStep = beforeStep;

// -------------------- afterStep --------------------------
/** ця функція виконується по закінченню кожного кроку
 * @param  step - опис кроку
 */
afterStep = async function (step) {
  // ця функція виконується перед початком кожного кроку
  let trace = 1,
    ln = this.ln + "afterStep::";
  trace ? log("i", ln, `Started`) : null;

  // зупиняємо ТРП печі
  await dev["furnaceTRP"].stop();

  trace ? log("i", ln, `Finished`) : null;
};

entities[0].thermProcess.afterStep = afterStep;

// if (trace) {
//   log("i", ln, `thermProcess.beforeStep=`);
//   console.dir(entities[0].thermProcess.beforeStep);
// }

config.entities = entities;

// таблица сопоставления адреса устройства и типа (массив где индекс - адрес устройства, а значение - имя файла драйвера)
config.devices = [
  "all", //0
  "trp08", //1
];
for (let index = 2; index < 16; index++) {
  config.devices[index] = "trp08";
}
config.devices[16] = "OWEN_MW110";
// список используемых алиасов с указанием физического имени регистра
// (т.е. адрес ModBus + сигнатура в драйвере устройства, например 7SQ1 => 5-DIO1 )
var tags = new Map();
tags.set("T1", "1-T");
tags.set("SP1", "1-tT");
tags.set("SP2", "2-tT");
tags.set("T2", "2-T");
//tags.set("state2", "2-state");
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
config.queue.work = ["1-T", "1-tT", "2-T", "2-tT"];
// config.queue.work = ["1-CTR", "1-VTR", "2-T", "2-tT", "3-T", "3-tT"];

module.exports = config;
log("i", ln, `---------- Config.js loaded! --------------`);

if (!module.parent) {
  console.dir(config, { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
