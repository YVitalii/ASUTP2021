const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const log = require("../../tools/log");

let driver = new ClassDriverGeneral({
  id: "trp08",
  header: { ua: `ТРП-08-ТП`, en: `TRP-08-TP`, ru: `ТРП-08-ТП` },
  comment: {
    ua: `Терморегулятор`,
    en: `Thermoregulator`,
    ru: `Терморегулятор`,
  },
  timeout: 2000,
});

driver.addRegister({
  id: "state",
  addr: 0x0000,
  header: { ua: `Стан приладу`, en: `Device's state`, ru: `Состояние прибора` },
  note: `Читання: 07Н=7- датчик в нормі в режимі "стоп"
                  17Н=23- датчик в нормі в режимі "пуск"
                  47Н=71- аварія датчик в режимі "стоп"
                  57Н=87- аварія датчика в режимі "пуск"
                  Запис: Пуск / Стоп приладу
                  11Н=17- Пуск (пререхід в режим "пуск")
                  01Н=1 - Стоп (перехід в режим "стоп")`,
  _get: function (arg) {
    return {
      data: {
        FC: 3,
        addr: this.addr,
        data: 0x1, //1 байт
      },
      err: null,
    };
  },
  get_: (buf) => {
    let note = this.title;
    let data = buf[1];
    let err = null;
    //this.value = this.states[data];
    switch (data) {
      case 7:
        note += "Стоп";
        break;
      case 23:
        note += "Пуск";
        break;
      case 71:
        note += "Авария в режиме Стоп";
        break;
      case 87:
        note += "Авария в режиме Пуск";
        break;
      default:
        note += "Неизвестный код состояния:" + data;
        err = note;
        data = null;
    }
    //note="state"
    return {
      data: { value: data, note: note },
      err: err,
    };
  },
  _set: function (data) {
    let err =
      "Недопустимый параметр для записи:" + data + " (можно: 17-Пуск;1 -Стоп)";
    if ((data == 1) | (data == 17)) {
      err = null;
    } else {
      data = null;
    }
    //
    //err= i ? null:("Ошибочный входной параметр:"+data);
    return {
      data: {
        FC: 6,
        addr: this.addr,
        data: data,
      },
      err: err,
    };
  },
  set_: function (buf) {
    //т.к. ответ будет эхо запроса, то возвращаем в дата Value
    return {
      data: { value: buf.readUInt16BE(), note: "" },
      err: null,
    };
  },
}); //driver.addRegister
// )
console.log("Driver=");
console.dir(driver, { depth: 3 });
module.exports = driver;
