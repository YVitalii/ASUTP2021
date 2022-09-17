/**
 * конфиг-файл с описанием печи
 */
const { priority } = require("../../config.js");
console.log(
  "------- SDO --- config.priority= --------------------------------"
);
console.dir(priority);
//const

let conf = {};
conf.id = "SDO-20-60-16-1250_2022"; // идентификатор печи, используется в URL, имя папки логов, имя папки настроек
conf.shortName = "СДО-20.60.16/12,5"; // короткое имя печи
conf.fullName = "Печь c выкатным подом " + conf.shortName; // полное имя печи
conf.temperature = { min: 0, max: 1250 }; // диапазон рабочих температур
conf.logger = "1-T; 2-T; 3-T; 4-T"; // список регистров для записи в архив
conf.devices = []; // массив с описанием всех приборов печи, подключенных через rs485

for (let i = 1; i < 5; i++) {
  conf.devices.push({
    addr: i,
    type: `trp08`, // тип прибора
    regs: [
      {
        id: `${i}-T`, // имя, точно такое как в драйвере прибора
        title: `T${i}`, // отображаемое имя для вывода в описании поля
        description: `Температура в зоне ${i}`, // детальное описание
        legend: `T${i}`, // Надпись для графика
        priority: priority.HIGHT,
      },
      {
        id: `${i}-tT`, // имя, точно такое как в драйвере прибора
        title: `SP${i}`, // отображаемое имя для вывода в описании поля
        description: `Заданная температура в зоне ${i}`, // детальное описание
        legend: `SP${i}`, // Надпись для графика
        priority: priority.LOW,
      },
      {
        id: `${i}-H`, // имя, точно такое как в драйвере прибора
        title: `H${i}`, // отображаемое имя для вывода в описании поля
        description: `Время разогрева зоны ${i}, мин`, // детальное описание
        legend: `H${i}`, // Надпись для графика
        priority: priority.LOW,
      },
      {
        id: `${i}-Y`, // имя, точно такое как в драйвере прибора
        title: `Y${i}`, // отображаемое имя для вывода в описании поля
        description: `Время удержания зоны ${i}, мин`, // детальное описание
        legend: `Y${i}`, // Надпись для графика
        priority: priority.LOW,
      },
      {
        id: `${i}-state`, // имя, точно такое как в драйвере прибора
        title: `Состояние ${i}`, // отображаемое имя для вывода в описании поля
        legend: `ST${i}`, // Надпись для графика
        description: `Режим работы прибора зоны ${i}`, // детальное описание
        priority: priority.MIDDLE,
      },
    ],
    simulator: {
      ogr: Math.ceil(conf.temperature.max / 50) + 1,
      furnace: {
        furnaceWeight: (i == 1) | (i == 3) ? 100 : 150,
        furnaceMaxT: conf.temperature.max,
        furnaceMaxLoss: (i == 1) | (i == 3) ? 20 : 30,
      },
    },
  }); // push ${i}
} //for

/**
 * список регистров, отображаемых на основном экране (с текущим состоянием печи)
 */
conf.listRegs = "";
for (let i = 1; i < 5; i++) {
  conf.listRegs += `${i}-T;${i}-state;`;
} //for
conf.listRegs = conf.listRegs.slice(0, -1);

module.exports = conf;

if (!module.parent) {
  let log = require("../../tools/log.js");
  log("i", "---------- conf  ---------");
  console.dir(conf, { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
