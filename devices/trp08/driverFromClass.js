const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const log = require("../../tools/log");

const degC = { ua: `°C`, en: `°C`, ru: `°C` };

// ---------- general functions ----------

function fromBCD(buf) {
  let res = { err: null, data: null };
  //console.log(buf);
  let str = buf.toString("hex");
  //console.log(str);
  let n1000 = str[0] * 1000;
  let n100 = str[1] * 100;
  let n10 = str[2] * 10;
  let n1 = str[3] * 1;
  let value = n1000 + n100 + n10 + n1;
  if (isNaN(value)) {
    res.err = new Error(buf.toString("hex") + "::Fail translate to Number");
  } else {
    res.data = { value };
  }
  return res;
}

function toBCD(val) {
  let line = ("0000" + String(val)).slice(-4);
  let arr;
  try {
    arr = parseInt(line, 16);
  } catch (error) {
    arr = null;
  }

  //console.log("toBCD:"+line);
  return arr;
}

function fromClock(buf) {
  //  преобразует Buffer ([hours,minutes]) ->  минуты
  let val = fromBCD(buf);
  let hrs = parseInt(val / 100);
  let mins = val - hrs * 100;
  return hrs * 60 + mins;
}

function toClock(val) {
  // преобразует минуты -> Buffer ([hours,minutes]) например 01:22 = [0x01,0x22]
  let hrs = parseInt(val / 60);
  let mins = val - hrs * 60;
  let b = toBCD(hrs * 100 + mins); // преобразуем в десятичное число , где часы - сотни, минуты -десятки и единицы
  //console.log("toClock input=",val,", output=",b,", buffer",new Buffer([b]));
  // ------------- нужно ВОЗВРАЩАТЬ ЧИСЛО ----------------
  return b;
}

// ---------- driver creation ------------
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

// ========= register descriptions ===============
// ------- state -------------
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
  get_: function (buf) {
    let note = this.id + "=";
    //console.log("", "buf=", buf);
    let data = buf[1];
    //console.log("", "data=", data);
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
        note += "Аварія в режимі Стоп";
        break;
      case 87:
        note += "Аварія в режимі Пуск";
        break;
      default:
        note += "Undefined state code" + data;
        err = new Error(note);
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
// ------- T -------------
driver.addRegister({
  id: "T",
  addr: 0x0001,
  units: degC,
  header: {
    ua: `Поточна температура`,
    en: `Current temperature`,
    ru: `Текущая температура`,
  },
  note: `Current temperature)`,
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
  get_: function (buf) {
    let res = fromBCD(buf);
    res.data.header = this.header;
    return res;
  },
  _set: function (data) {
    let err =
      "Недопустимый параметр для записи:" + data + " (можно: 17-Пуск;1 -Стоп)";
    if ((data == 1) | (data == 17)) {
      err = null;
    } else {
      data = null;
    }

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
    return this.get_(buf);
  },
}); //driver.addRegister

module.exports = driver;

if (!module.parent) {
  console.log("Driver=");
  console.dir(driver, { depth: 3 });
  driver.printRegsDescription();
  for (let key of driver.regs.keys()) {
    console.log(`${key}._get(10)`, driver.regs.get(key)._get(7));
    console.log(
      `${key}.get_(10)`,
      driver.regs.get(key).get_(new Buffer.from([0, 7]))
    );
  }
}
