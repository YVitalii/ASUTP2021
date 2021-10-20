var trp08 = require("../rs485/TRP08_registers.js");

var entity = {
  id: "SDO-16-45-12-10",
  shortName: "СДО-16.45.12/10", // короткое имя печи
  fullName: "Печь отпускная СДО-16.45.12/10", // полное имя печи
  temperature: { min: 0, max: 1000 }, // диапазон рабочих температур
  listRegs: "1-T;2-T;3-T;4-T;1-state;2-state;3-state", // список регистров для запроса, что бы их не генерировать каждый раз
  listLogRegs: "1-T;2-T;3-T;4-T", // список регистров для записи в log-файл
  devices: { 1: trp08(1), 2: trp08(2), 3: trp08(3), 4: trp08(4) },
  regs: {},
};

if (!module.main) {
  console.dir(entity, { depth: 4 });
  //console.dir(new Buffer.from([15, 10, 8]), { depth: 4 });
  //util.inspect(config)
}
