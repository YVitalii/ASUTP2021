function getRegs(addr) {
  var regs = {};
  // описываем регистры входов
  for (var i = 1; i <= 16; i++) {
    let regName = `${addr}-DIO${i}`;
    regs[regName] = {
      // реальный адрес регистра, по которому нужно делать запрос
      title: regName, // отображаемое имя для вывода в описании поля
      type: "boolean", // тип поля
      units: "", //единицы
      description: `Вход №` + regName, // описание
      legend: `Вход №` + regName, //`Вход №${i}`, // Надпись для графика
      isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } //for
  // описываем регистры выходов
  for (var i = 17; i <= 24; i++) {
    let regName = `${addr}-DIO${i}`;
    regs[regName] = {
      // реальный адрес регистра, по которому нужно делать запрос
      title: regName, // отображаемое имя для вывода в описании поля
      type: "boolean", // тип поля
      units: "", //единицы
      description: `Выход №` + regName, // описание
      legend: `Выход №` + regName, //`Вход №${i}`, // Надпись для графика
      isOperative: true, //оперативный регистр опрашивается в цикле (быстро изменяющийся)
    };
  } //for

  return regs;
}

module.exports = getRegs;

if (!module.parent) {
  console.log("================= testing WAD-DIO24.registers ================");
  //console.dir(getRegs(2), { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
