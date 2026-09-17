const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const { degC, lpm, m3ph, percent } = require("../../config.js").units;
const log = require("../../tools/log.js"); // логер
const gLn = "TRM251_driver::";

/** Функція для скорочення записів
 * env = Object of ClassDriverRegisterGeneral
 */
const apiError = require("../../tools/apiError.js");
const _getFC3 = function (env) {
  //console.dir(this);
  return {
    data: {
      FC: 3,
      addr: env.addr,
      data: 4, //4 слова = 8 байт: [2:dot:int16, 4:valueInteger:int32, 2:status:int16]
    },
    err: null,
  };
};

/**
 * Throws an error indicating that the specified register is read-only.
 *
 * @param {Object} env - The environment object containing register details (env=this).
 * @param {string} env.id - The identifier of the register.
 * @return {err:Error,data:null} return an error indicating that the register is read-only.
 */
let readOnly = function (env) {
  let err = new Error(`Register "${env.id}" is readonly !`);
  return { err, data: null };
};

/**
 * Converts the given data to a number.
 *
 * @param {Buffer|string} data - The data to be converted to a number. It can be a Buffer or a string.
 * @param {Object} env=this - The environment object containing additional information.
 * @param {number} env.ln - The log number or identifier.
 * @param {string} env.id - The identifier for the current operation.
 * @returns {number} - The converted number.
 * @throws {Error} - Throws an error if the data cannot be converted to a valid number.
 */
const toNumber = function (data, env) {
  let trace = 0,
    ln = env.ln + `toNumber():id=${env.id}::`;
  trace ? log("i", ln, `data=${data}`) : null;
  // console.dir(data);
  let value;
  if (Buffer.isBuffer(data)) {
    trace ? log("i", ln, `Data is buffer!::` + typeof data) : null;

    value = data.readUInt16BE(0);
  } else {
    value = parseInt(data);
  }
  if (isNaN(value)) {
    throw new Error(ln + "Invalid number");
  }
  trace ? log("i", ln, `value=${value}`) : null;
  return value;
};

// ---------- driver creation ------------

let driver = new ClassDriverGeneral({
  id: "TRM251_driver",
  header: {
    ua: `TRM251_driver`,
    en: `TRM251_driver`,
    ru: `TRM251_driver`,
  },
  comment: {
    ua: `ПІД-терморегулятор`,
    en: `PID-thermoregulator`,
    ru: `ПИД-терморегулятор`,
  },
  timeout: 5000,
});

// регістри зі значеннями аналогових входів
// 2025-09-18 при відключеній термопарі входу №2 отримуємо успішне вимірювання потрібно розбиратися

for (let i = 1; i < 3; i++) {
  driver.addRegister({
    id: `I${i}`,
    addr: 0x0000 + 6 * (i - 1),
    header: { ua: `Вхід${i}`, en: `Input${i}`, ru: `Вход${i}` },
    note: `Value${i}`,
    units: degC,
    _get: function (arg) {
      let req = _getFC3(this),
        ln = "_get::",
        trace = 0;
      if (trace) {
        console.log(ln + `req=`);
        console.dir(req);
      }
      return req;
    },
    get_: function (arg) {
      let trace = 0,
        ln = gLn + this.id + `::get_::`;
      if (trace) {
        log("i", ln, `arg=`);
        console.dir(arg);
      }
      let note,
        data,
        err = null;
      // положення крапки
      let pointOffset = arg.slice(0, 2).readUInt16BE();
      // температура
      data = arg.slice(2, 6).readUInt32BE() / (10 * pointOffset);
      // статус
      let status = arg.slice(6).readUInt16BE();
      let statusMsg = getNote(status);
      note = statusMsg.ua;
      if (status > 0) {
        err = statusMsg;
        data = null;
      }

      trace
        ? console.log(
            ln +
              `pointOffset=${pointOffset}; data=${data}; status=${status}; note=${note} `,
          )
        : null;

      return { err, data: { value: data, note } };
    },
    _set: function (arg) {
      return readOnly(this);
    },
    set_: function (arg) {
      return readOnly(this);
    },
  });
} // for (let i = 1; i < 3; i++)

// ------------ tT ---------
driver.addRegister({
  id: "tT",
  addr: 0x000d,
  header: {
    ua: `Цільова температура`,
    en: `Current set point`,
    ru: `Целевая температура`,
  },
  note: `Current set point`,
  units: degC,
  _get: function (arg) {
    let trace = 0,
      ln = this.id + `::_get(${arg})::`;
    let req = _getFC3(this);
    req.data.data = 1;
    if (trace) {
      console.log(ln + `req=`);
      console.dir(req, { depth: 1 });
    }
    return req;
  }, //_get
  get_: function (arg) {
    let trace = 0,
      ln = this.id + `::get_(${arg})::`;

    // поточна уставка
    let value = arg.readInt16BE() / 10;
    let res = { err: null, data: { value, note: this.note } };
    if (trace) {
      console.log(ln + `res=`);
      console.dir(res, { depth: 1 });
    }
    return res;
  }, //get_
  _set: function (arg) {
    return readOnly(this);
  },
  set_: function (arg) {
    return readOnly(this);
  },
}); // addRegister(tT)

// ------------ mode  ---------
driver.addRegister({
  id: "mode",
  addr: 0x0011,
  header: { ua: `Режим роботи`, en: `Working mode`, ru: `Режим работы` },
  note: `Working mode`,
  units: { ua: ``, en: ``, ru: `` },
  _get: function (arg = 0) {
    let trace = 0,
      ln = this.id + `::_get(${arg})::`;
    let req = _getFC3(this);
    req.data.data = 1;
    if (trace) {
      console.log(ln + `req=`);
      console.dir(req, { depth: 1 });
    }
    return req;
  }, //_get
  get_: function (arg) {
    let trace = 0,
      ln = this.id + `::get_(${arg})::`;
    let note = this.note;
    err = null;
    // поточна уставка
    let value = arg.readUInt16BE();
    let res = { err, data: { value, note } };
    if (trace) {
      console.log(ln + `res=`);
      console.dir(res, { depth: 1 });
    }
    return res;
  }, //get_
  _set: function (arg) {
    return readOnly(this);
  },
  set_: function (arg) {
    return readOnly(this);
  },
}); // addRegister(tT)

// ------------ startStop  ---------
driver.addRegister({
  // при стпробу запуску вже запущеного приладу або зупинки вже зупиненого отримуємо помилку ModBus
  id: "startStop",
  addr: 0x0050,
  header: { ua: `Старт/Стоп`, en: `Start/Stop`, ru: `Старт/Стоп` },
  note: `Write coil`,
  units: { ua: ``, en: ``, ru: `` },
  _get: function (arg) {
    // костиль бо немає часу розробляти функцію читання котушки FC1
    return readOnly(this);
  }, //_get
  get_: function (arg) {
    // костиль бо немає часу розробляти функцію читання котушки FC1
    return readOnly(this);
  }, //get_
  _set: function (arg) {
    let trace = 0,
      ln = this.id + `::_set(${arg})::`;
    let data = null,
      err = null;
    if (arg == 1 || arg == 0xff00) {
      // записуємо 0xff00 для увімкнення і 0x0000 для вимкнення
      data = 0xff00;
    } else if (arg == 0) {
      data = 0x0000;
    } else {
      // invalid value
      err = new Error(
        ln + `Invalid value=${arg} for startStop register! Should be 0 or 1`,
      );
      return { err, data };
    }

    let req = _getFC3(this);
    if (trace) {
      console.log(ln + `_getFC3()::req=`);
      console.dir(req, { depth: 1 });
    }
    req.data.FC = 5; // функція
    req.data.data = data; // значення для запису
    if (trace) {
      console.log(ln + `req=`);
      console.dir(req, { depth: 1 });
    }
    return req;
  }, //_set

  set_: function (arg) {
    if (Buffer.isBuffer(arg)) {
      arg = arg.readUInt16BE();

      if (arg == 0xff00) {
        return { err: null, data: { value: 1, note: "Started" } };
      }
      if (arg == 0x00) {
        return { err: null, data: { value: 0, note: "Stopped" } };
      }
    }
  }, //set_
}); // addRegister(startStop)

const programmAllocation = 4; // Зміщення уставки відносно 0x0100

driver.addRegister({
  id: "program",
  addr: 0x0101,
  header: { ua: `Программа`, en: `Program`, ru: `Программа` },
  note: `read / write program`,
  units: { ua: `nulls`, en: ``, ru: `` },
  _get: function (arg = 1) {
    /** arg - номер програми */
    let data = {
        addr: this.addr,
        FC: 3,
        data: this.maxSteps * 4, // на кожний крок використовується 4 регістра х 2 байти
      },
      err = null;
    return { err, data };
  }, //_get
  get_: function (arg) {
    let trace = 0,
      ln = gLn + this.id + `::get_::`,
      txt = "";
    if (trace) {
      log("i", ln, `Started with arg=`);
      programBufLog(arg);
      console.dir(arg);
      // console.dir(this);
    }
    // // положення крапки

    // let timeScale = arg.slice(2, 0).readUInt16BE() == 0 ? "HH:MM" : "MM:SS";
    // trace ? console.log("Time scale=", timeScale) : null;
    // program.exit();
    let programSteps = this.maxSteps; // кількість кроків у програмі
    let program = [
      {
        id: "program1",
        // timeScale: timeScale,
        note: {
          ua: "Завантажено з приладу",
          en: "Downloaded from device",
          ru: "Загружено с прибора",
        },
      },
    ];
    for (let step = 0; step < parseInt(arg.length / 8); step++) {
      // 2025-12-29 уставка починається не з 2 байта а з 4,
      // уставка1 =  0x0102 і т.д. ймовірно помилка
      // при зміщенні на 2  - програма читається коректно
      // тому поки буде так, при нагоді розібратися
      // 2026-09-16 При спробі прочитати 3*5*4+2=62 байти отримуємо помилку RS485, з цього можна зробити висновок, що
      // 2026-09-17 ВИрішив відмовитится від считування масштабу часу, бо при відповіді повертається замість 2-х байтів → 4
      // чому так не зрозуміло, тому відмовисвся від считування цього параметру. Він const та задається в налаштуваннях
      //
      let addr = step * 8;
      let point = 1 / 10 ** arg.readUInt16BE(addr + 2);
      let SP = arg.readInt16BE(addr) * point;
      // 2025-12-29 В описі вказано, що час зберігається та передається в секундах, але схоже що
      // все-таки: для "ГГ:ХХ" в хвилинах, можливо для "ХХ:СС" - в секундах   -потребує уточненя
      let H = parseInt(arg.readUInt16BE(addr + 4));
      let Y = parseInt(arg.readUInt16BE(addr + 6));

      program.push({ type: "taskThermal_TRM251", tT: SP, H: H, Y: Y });
    }
    if (trace) {
      console.dir(program[0]);
      console.table(program.slice(1));
    }
    return { err: null, data: { value: program, note: this.note } };
  }, //get_
  /** масив з кроками програми
   * arg=[
   * // елемент 0 = інформація про програму
   * {id: string, timeScale: string "HH:MM" || "MM:SS"; note:""},
   * // tT - уставка,°C; H - час нагрівання, хв; Y - час утримання, хв
   * {tT: number, H: number, Y: number}, // крок 1
   * {tT: number, H: number, Y: number}, // крок 2
   * {tT: number, H: number, Y: number}, // крок 3
   * {tT: number, H: number, Y: number}, // крок 4
   * {tT: number, H: number, Y: number}, // крок 5
   * ]
   */
  _set: function (arg) {
    let data = {
        addr: this.addr,
        FC: 0x10,
      },
      err = null,
      ln = gLn + this.id + "::_set()::",
      trace = 1;

    if (!Array.isArray(arg)) {
      throw new Error(ln + "arg should be an Array");
    }

    if (trace) {
      console.log(ln + `Started with arg=`);
      console.dir(arg, { depth: 1 });
    }
    if (arg.length > this.maxLength + 1) {
      throw new Error(ln + "Max steps quantity = 15!!");
    }
    let buf = Buffer.alloc(arg.length * 4 * 2); // зміщення 4 потрібно перевірити чому має бути 2
    // робимо на 1 крок більше, що би гарантовано останній крок був 0,0,0,0 або кроком з даними
    // 2026-09-17 масштаб часу задається в налаштуваннях приладу та незмінний,рахуємо що це ГГ:ХВ
    // if (arg[0].timeScale == "MM:SS") {
    //   buf.writeUInt16BE(0, 1); // формат часу MM:SS
    // }
    // //по замовчуванню: формат часу HH:MM так як пустий буфер вже заповнено "0"

    for (let i = 1; i < arg.length; i++) {
      //схоже невірно вказані адреси в описі див. примітки до get_
      //
      let addr = (i - 1) * 8;
      let sp = arg[i].tT;
      buf.writeUInt16BE(sp, addr); // set point
      buf.writeUInt16BE(0, addr + 2); //decimal point position
      buf.writeUInt16BE(arg[i].H, addr + 4); // min, heating time
      buf.writeUInt16BE(arg[i].Y, addr + 6); // min, holding time
    } // for (let step =1; step < 6; step++)

    data.data = buf;

    if (trace) {
      console.log(ln + `Parsed to buffer program: buf=`);
      programBufLog(buf);
      // console.dir(buf, { depth: 1 });
      console.log(ln + "deParsed Program from Buffer (for inspection)::");
      console.dir(this.get_(buf), { depth: 3 });
    }

    //process.exit();
    return { err, data };
  },
  set_: function (arg) {
    let value = arg.readUInt16BE(),
      err = null;
    return { err, data: { value, note: this.note } };
  },
}); // addRegister(program)
driver.regs.get("program").maxSteps = 15;

// ------------ current step  ---------
driver.addRegister({
  id: "step",
  addr: 0x0010,
  header: { ua: `Поточний крок`, en: `Current step`, ru: `Текущий шаг` },
  note: `Current step`,
  units: { ua: ``, en: ``, ru: `` },
  _get: function (arg) {
    let data = {
        addr: this.addr,
        FC: 3,
        data: 1,
      },
      err = null;
    return { err, data };
  }, //_get
  get_: function (arg) {
    let value = arg.readUInt16BE(),
      err = null;
    return { err, data: { value, note: this.note } };
  }, //get_
  _set: function (arg = 1) {
    // якщо крок поза межами 1..5 то помилка
    if (arg < 1 || arg > 5) {
      let err = new RangeError(
        `Invalid value=${arg} for step register! Should be 1..5`,
      );
      return { err, data: null };
    }
    let data = {
        addr: this.addr,
        FC: 6,
        data: arg,
      },
      err = null;
    return { err, data };
  },
  set_: function (arg) {
    let value = arg.readUInt16BE(),
      err = null;
    return { err, data: { value, note: this.note } };
  },
}); // addRegister()

// ------------ current ProgramN  ---------
driver.addRegister({
  id: "programN",
  addr: 0x000f,
  header: {
    ua: `Поточний програма`,
    en: `Current program`,
    ru: `Текущиая программа`,
  },
  note: `Current program Number`,
  units: { ua: ``, en: ``, ru: `` },
  _get: function (arg) {
    let data = {
        addr: this.addr,
        FC: 3,
        data: 1,
      },
      err = null;
    return { err, data };
  }, //_get
  get_: function (arg) {
    let value = arg.readUInt16BE(),
      err = null;
    return { err, data: { value, note: this.note } };
  }, //get_
  _set: function (arg = 1) {
    // якщо крок поза межами 1..5 то помилка
    if (arg < 1 || arg > 3) {
      let err = new RangeError(
        `Invalid value=${arg} for programN register! Should be 1..3`,
      );
      return { err, data: null };
    }
    let data = {
        addr: this.addr,
        FC: 6,
        data: arg,
      },
      err = null;
    return { err, data };
  },
  set_: function (arg) {
    let value = arg.readUInt16BE(),
      err = null;
    return { err, data: { value, note: this.note } };
  },
}); // addRegister()

// ------------ program x step x tT---------
// пряме читання/запис будь-якого регістра по адресі вказаній в
//
driver.addRegister({
  id: "p1s1",
  addr: 0x0109,
  header: {
    ua: `program x step x tT`,
    en: `program x step x tT`,
    ru: `program x step x tT`,
  },
  note: `program x step x tT`,
  units: { ua: ``, en: ``, ru: `` },
  _get: function (arg = 0) {
    let trace = 1,
      ln = this.id + `::_get(${arg})::`;
    let req = _getFC3(this);
    req.data.data = 4;
    if (trace) {
      console.log(ln + `req=`);
      console.dir(req, { depth: 1 });
    }
    return req;
  }, //_get
  get_: function (arg) {
    let trace = 1,
      ln = this.id + `::get_(${arg})::`;

    // поточна уставка
    let value = {
      tT: arg.readInt16BE(0),
      point: arg.readInt16BE(2),
      H: arg.readInt16BE(4),
      Y: arg.readInt16BE(6),
    };
    let res = { err: null, data: { value, note: this.note } };
    if (trace) {
      console.log(ln + `res=`);
      console.dir(res, { depth: 1 });
    }
    return res;
  }, //get_
  _set: function (arg) {
    return readOnly(this);
  },
  set_: function (arg) {
    return readOnly(this);
  },
}); // addRegister(tT)

function getNote(code) {
  const offsetStatusCode = 0xf000;
  let res;
  switch (code) {
    case 0:
      res = {
        ua: `Вимірювання успішне`,
        en: `Measurement successful `,
        ru: `Измерение успешное`,
      };
      break;
    case offsetStatusCode + 6:
      res = {
        ua: `Дані не готові`,
        en: `Data isn't ready`,
        ru: `Данные не готовы`,
      };
      break;
    case offsetStatusCode + 7:
      res = {
        ua: `Датчик відключений`,
        en: `Sensor unconnected`,
        ru: `Датчик не подключен`,
      };
      break;
    case offsetStatusCode + 8:
      res = {
        ua: `Велика температура вільних кінців термопари`,
        en: `High temperature of the free ends of the thermocouple`,
        ru: `Высокая температура свободных концов термопары`,
      };
      break;
    case offsetStatusCode + 9:
      res = {
        ua: `Мала температура вільних кінців термопари`,
        en: `Low temperature of the free ends of the thermocouple`,
        ru: `Низкая температура свободных концов термопары`,
      };
      break;
    case offsetStatusCode + 10:
      res = {
        ua: `Виміряне значення занадто велике`,
        en: `The measured value is too high.`,
        ru: `Измеренное значение слишком велико`,
      };
      break;
    case offsetStatusCode + 11:
      res = {
        ua: `Виміряне значення занадто мале`,
        en: `The measured value is too low.`,
        ru: `Измеренное значение слишком маленькое`,
      };
      break;
    case offsetStatusCode + 12:
      res = {
        ua: `Коротке замикання датчика`,
        en: `Sensor short circuit`,
        ru: `Короткое замыкание датчика`,
      };
      break;
    case offsetStatusCode + 13:
      res = { ua: `Обрив датчика`, en: `Sensor break`, ru: `Обрыв датчика` };
      break;
    case 14:
      res = {
        ua: `Відсутність зв'язку з АЦП `,
        en: `No communication with ADC`,
        ru: `Обрыв связи с АЦП`,
      };
      break;
    case offsetStatusCode + 16:
      res = {
        ua: `Некоректний калібрувальний коефіцієнт `,
        en: `Incorrect calibration factor`,
        ru: `Не корректный калибровочный коефициент`,
      };
      break;
    default:
      res = {
        ua: `Невизначена помилка`,
        en: `Undefined error`,
        ru: `Неизвестная ошибка`,
      };
      break;
  }
  return res;
}

// ------- state -------------
module.exports = driver;
// console.dir(driver);

function programBufLog(buf) {
  console.log("============================ program buffer =============");
  console.log(
    `Time scale: ${buf.readUInt16BE(2).toString(16)}` + buf.readUInt16BE(2),
  );
  let out = [],
    programmAllocation = 0;
  for (let i = 0; i < parseInt((buf.length - programmAllocation) / 8); i++) {
    let row = [],
      rowN = i * 8 + programmAllocation;
    for (let j = 0; j < 4; j++) {
      let res = buf.readUInt16BE(rowN + j * 2);
      if (j == 0 && res == 0) {
        break;
      }
      row.push("0x" + ("0000" + res.toString(16)).slice(-4) + `(${res})`);
    }
    if (row.length == 0) {
      continue;
    }
    out.push(row);
  }
  console.table(out);
}
