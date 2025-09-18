const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const { degC, lpm, m3ph, percent } = require("../../config.js").units;
const log = require("../../tools/log.js"); // логер
/** Функція для скорочення записів
 * env = Object of ClassDriverRegisterGeneral
 */

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
 * @throws {Error} Throws an error indicating that the register is read-only.
 */
let readOnly = function (env) {
  throw new Error(`Register "${env.id}" is readonly !`);
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
    en: `PID-thermo regulator`,
    ru: `ПИД-терморегулятор`,
  },
  timeout: 2000,
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
        ln = `get_::`;
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
              `pointOffset=${pointOffset}; data=${data}; status=${status}; note=${note} `
          )
        : null;

      return { err, data: { value: data, note } };
    },
    _set: function (arg) {
      readOnly(this);
    },
    set_: function (arg) {
      readOnly(this);
    },
  });
}

function getNote(code) {
  const offsetStatusCode = 0x0f00;
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
