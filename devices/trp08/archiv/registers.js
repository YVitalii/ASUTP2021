var regsList = new Map(); // список описаний регистров
// ------------ логгер  --------------------
const log = require("../../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)

// ----- текущая температура ----------------
regsList.set(
  "T",
  (addr) => {
    return {
      tag: `${addr}-T`, // реальный адрес регистра, по которому нужно делать запрос
      title: `T${addr},\u00b0C`, // отображаемое имя для вывода в описании поля
      type: "integer", // тип поля
      units: "\u00b0C", //единицы
      description: `Текущая температура ${addr}`, // описание
      legend: `Т${addr}`, // Надпись для графика
      isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } // T
); //regsList.set(
regsList.set(
  "taskT",
  (addr) => {
    return {
      tag: `${addr}-tT`, // реальный адрес регистра, по которому нужно делать запрос
      title: `SP${addr}`, // отображаемое имя для вывода в описании поля
      type: "integer", // тип поля
      units: "\u00b0C", //единицы
      description: `Заданная температура ${addr}`, // описание
      legend: `Т${addr}`, // Надпись для графика
      isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } // (addr) =>
); // regsList.set(

regsList.set(
  "H",
  (addr) => {
    return {
      tag: `${addr}-H`, // реальный адрес регистра, по которому нужно делать запрос
      title: `H${addr}`, // отображаемое имя для вывода в описании поля
      type: "integer", // тип поля количество минут
      units: "мин", // минуты
      description: `Время нагрева`, // описание
      legend: `Нагрев ${addr}`, // Надпись для графика
      isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } // (addr) =>
); // regsList.set(

regsList.set(
  "Y",
  (addr) => {
    return {
      tag: `${addr}-Y`, // реальный адрес регистра, по которому нужно делать запрос
      title: `Y${addr}`, // отображаемое имя для вывода в описании поля
      type: "integer", // тип поля количество минут
      units: "мин", // минуты
      description: `Зона №${addr}.Время выдержки`, // описание
      legend: `№${addr}.Выдержка`, // Надпись для графика
      isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } // (addr) =>
); // regsList.set(

regsList.set(
  "state",
  (addr) => {
    return {
      tag: `${addr}-state`, // реальный адрес регистра, по которому нужно делать запрос
      title: `Состояние${addr}`, // отображаемое имя для вывода в описании поля
      type: "integer", // run=1  stop=0
      units: "", //
      description: `Состояние прибора `, // описание
      legend: `Состояние ${addr}`, // Надпись для графика
      isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } // (addr) =>
); // regsList.set(

/**
 *
 * @param {Number} addr - адрес прибора в сети RS485
 * @param {String} list - строка со списком необходимых регистров и разделителем ";", если списка нет - то все описанные регистры
 *
 */

function getRegs(addr, list = "") {
  // ----------- настройки логгера локальные --------------
  let logN = logName + "getRegs():";
  let trace = 1;
  trace = gTrace != 0 ? gTrace : trace;
  trace
    ? log(
        "i",
        logN,
        `addr=${addr}; list=`,
        JSON.stringify(list),
        ";Started! >----"
      )
    : null;
  // --------  конец настройки логера  -----------------
  // если список регистров пустой - значит все регистры
  let allRegs = list || false;
  // если список не пустой, создаем список заданных регистров
  if (!allRegs) {
    let array = list.split(";");
    for (let i = 0; i < array.length; i++) {
      array[i] = array[i].trim();
    }
    let listRegs = new Set(array);
    trace ? log("i", `listRegs=`) : null;
    trace ? console.dir(listRegs) : null;
  }
  //
  let parsedRegs = {};
  //
  for (let entry of regsList) {
    //log("i", entry);
    let [key, value] = entry;
    trace ? log("i", `key=${key};value=`, value) : null;
    let reg = value(addr);
    trace ? log("i", `regTag=${reg.tag};value=`, reg) : null;
    if (!allRegs) {
      if (!list[key]) {
        continue;
      }
    }
    regs[reg.tag] = reg;
    //regs.push(entry(addr)
  }
  let line = JSON.stringify();

  return;

  // // текущая температура addr-T
  // regs[`${addr}-T`] = {
  //   // реальный адрес регистра, по которому нужно делать запрос
  //   title: `T${addr}`, // отображаемое имя для вывода в описании поля
  //   type: "integer", // тип поля
  //   units: "\u00b0C", //единицы
  //   description: `Зона №${addr}`, // описание
  //   legend: `Зона№${addr}`, // Надпись для графика
  //   isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
  // };
  // // задание
  // regs[`${addr}-tT`] = ;
  // // время нарастания
  // //regs[] = ;
  // // время удержания
  // regs[`${addr}-Y`] = ;
  // // состояние Пуск/Стоп
  // regs[`${addr}-state`] = {;

  // return regs;
}

module.exports = getRegs;

if (!module.parent) {
  //console.dir(regsList, { depth: 4 });
  getRegs(2);

  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
