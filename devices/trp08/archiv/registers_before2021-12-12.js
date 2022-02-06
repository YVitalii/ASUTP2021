var regsList= new Map(); // список описаний регистров

regsList.set(
  "T" , (addr) => {
              return {
                tag:`${addr}-T`,// реальный адрес регистра, по которому нужно делать запрос
                title: `T${addr},\u00b0C`, // отображаемое имя для вывода в описании поля
                type: "integer", // тип поля
                units: "\u00b0C", //единицы
                description: `Зона №${addr}`, // описание
                legend: `Зона№${addr}`, // Надпись для графика
                isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
              }
      }, // T
); //regsList.set(
regsList.set(
  "taskT" , (addr) => {
    return {
          tag:`${addr}-tT`,// реальный адрес регистра, по которому нужно делать запрос
          title: `SP${addr}`, // отображаемое имя для вывода в описании поля
          type: "integer", // тип поля
          units: "\u00b0C", //единицы
          description: `Задание`, // описание
          legend: `Задание`, // Надпись для графика
          isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
          }
  }, // (addr) =>
); // regsList.set(

  regsList.set(
    "H" , (addr) => {
      return {
        tag:`${addr}-H`,// реальный адрес регистра, по которому нужно делать запрос
        title: `H${addr}`, // отображаемое имя для вывода в описании поля
        type: "integer", // тип поля количество минут
        units: "мин", // минуты
        description: `Время нагрева`, // описание
        legend: `Нагрев`, // Надпись для графика
        isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
      }
      }, // (addr) =>
); // regsList.set(



regsList.set(
    "" , (addr) => {
      return 
      }, // (addr) =>
); // regsList.set(


  regsList.set(
    "" , (addr) => {
      return 
      }, // (addr) =>
); // regsList.set(


  regsList.set(
    "" , (addr) => {
      return 
      }, // (addr) =>
); // regsList.set(



function getRegs(addr) {
  let regs = {};
  // текущая температура addr-T
  regs[`${addr}-T`] = {
    // реальный адрес регистра, по которому нужно делать запрос
    title: `T${addr},\u00b0C`, // отображаемое имя для вывода в описании поля
    type: "integer", // тип поля
    units: "\u00b0C", //единицы
    description: `Зона №${addr}`, // описание
    legend: `Зона№${addr}`, // Надпись для графика
    isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
  };
  // задание
  regs[`${addr}-tT`] = ;
  // время нарастания
  regs[] = ;
  // время удержания
  regs[`${addr}-Y`] = {
    // реальный адрес регистра, по которому нужно делать запрос
    title: `Y${addr}`, // отображаемое имя для вывода в описании поля
    type: "integer", // тип поля количество минут
    units: "мин", // минуты
    description: `Зона №${addr}.Время выдержки`, // описание
    legend: `№${addr}.Выдержка`, // Надпись для графика
    isOperative: false, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
  };
  // состояние Пуск/Стоп
  regs[`${addr}-state`] = {
    // реальный адрес регистра, по которому нужно делать запрос
    title: `Состояние${addr}`, // отображаемое имя для вывода в описании поля
    type: "integer", // тип поля количество минут
    units: "integer", // минуты
    description: `Зона №${addr}.Состояние`, // описание
    legend: `№${addr}.Состояние`, // Надпись для графика
    isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
  };

  return regs;
}

module.exports = getRegs;

if (!module.parent) {
  console.dir(getRegs(2), { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
