
const {
    fromBCD,
    toBCD,
    fromClock,
    toClock,
  } = require("./driver_generalFunctions.js");
const degC = { ua: `°C`, en: `°C`, ru: `°C` };
const clockUnits = { ua: `хв`, en: `min`, ru: `мин` };

// ---------- general functions ----------
let _getFC3 = function (env) {
    //console.dir(this);
    return {
      data: {
        FC: 3,
        addr: env.addr,
        data: 0x1, //1 байт
      },
      err: null,
    };
  };

const ClassDriverGeneral=require("../classDeviceGeneral/ClassDriverGeneral.js");

const driver=new ClassDriverGeneral({
    id:"driver_trp08",
    header:{ua:"Драйвер_ТРП-08",en:"Driver_TRP-08",ru:"Драйвер_ТРП-08"},
    comment:{ua:"Драйвер терморегулятора ТРП-08",en:"Driver of thermoregulator TRP-08",ru:"Драйвер терморегулятора ТРП-08"},
    timeout:2000,
});

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
      return _getFC3(this);
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
      let err;
  
      if ((data == 1) | (data == 17)) {
        err = null;
        data = {
          FC: 6,
          addr: this.addr,
          data: data,
        };
      } else {
        err = new Error(
          "Недопустимый параметр для записи:" + data + " (можно: 17-Пуск;1 -Стоп)"
        );
        data = null;
      }
      return { err, data };
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
    note: `Current temperature.`,
    _get: function (arg) {
      return _getFC3(this);
    },
    get_: function (buf) {
      let res = fromBCD(buf);
      res.data.note = this.note;
      return res;
    },
    _set: function (data) {
      return {
        data: null,
        err: new Error(this.ln + "_set(T)::Register T readonly !!"),
      };
    },
    set_: function (buf) {
      //буде помилка
      return this._set(buf);
    },
  }); //driver.addRegister
  
// ------- tT -------------
driver.addRegister({
    id: "tT",
    addr: 0x0100,
    units: degC,
    header: {
      ua: `Цільова температура`,
      en: `Task temperature`,
      ru: `Целевая температура`,
    },
    note: `Task temperature`,
    _get: function (arg) {
      return _getFC3(this);
    },
    get_: function (buf) {
      let res = fromBCD(buf);
      res.data.note = this.note;
      return res;
    },
    _set: function (data) {
      let res = toBCD(data);
      if (res.err != null) return res;
      res.data.FC = 6;
      res.data.addr = this.addr;
      return res;
    },
    set_: function (buf) {
      //буде помилка
      let res = fromBCD(buf);
      if (res.err != null) return res;
      res.data.note = this.note;
      return res;
    },
  }); //driver.addRegister

// ------- timer ---------------
  driver.addRegister({
    id: "timer",
    addr: 0x0002,
    units: clockUnits,
    header: {
      ua: `Поточний таймер`,
      en: `Current timer`,
      ru: `Текущий таймер`,
    },
    note: `Current timer.`,
    _get: function (arg) {
      return _getFC3(this);
    },
    get_: function (buf) {
      let res = {err:null,data:{value:fromClock(buf),note:this.note}};
      return res;
    },
    _set: function (data) {
      return {
        data: null,
        err: new Error(this.ln + "_set(T)::Register T readonly !!"),
      };
    },
    set_: function (buf) {
      //буде помилка
      return this._set(buf);
    },
  }); //driver.addRegister


  

  module.exports = driver;