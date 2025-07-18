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
      data: 0x2, //2 байт
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
  id: "MB110-8A_driver",
  header: {
    ua: `MB110-8A_driver`,
    en: `MB110-8A_driver`,
    ru: `MB110-8A_driver`,
  },
  comment: {
    ua: `Модуль аналового вводу`,
    en: `Analog Input Module`,
    ru: `Модуль аналогового ввода`,
  },
  timeout: 2000,
});

function getNote(code) {
  let res;
  switch (code) {
    case 0:
      res = {
        ua: `Значення помилкове`,
        en: `Value is false`,
        ru: `Значение ошибочное`,
      };
      break;
    case 6:
      res = {
        ua: `Дані не готові`,
        en: `Data isn't ready`,
        ru: `Данные не готовы`,
      };
      break;
    case 7:
      res = {
        ua: `Датчик відключений`,
        en: `Sensor unconnected`,
        ru: `Датчик не подключен`,
      };
      break;
    case 8:
      res = {
        ua: `Велика температура вільних кінців термопари`,
        en: `High temperature of the free ends of the thermocouple`,
        ru: `Высокая температура свободных концов термопары`,
      };
      break;
    case 9:
      res = {
        ua: `Мала температура вільних кінців термопари`,
        en: `Low temperature of the free ends of the thermocouple`,
        ru: `Низкая температура свободных концов термопары`,
      };
      break;
    case 10:
      res = {
        ua: `Виміряне значення занадто велике`,
        en: `The measured value is too high.`,
        ru: `Измеренное значение слишком велико`,
      };
      break;
    case 11:
      res = {
        ua: `Виміряне значення занадто мале`,
        en: `The measured value is too low.`,
        ru: `Измеренное значение слишком маленькое`,
      };
      break;
    case 12:
      res = {
        ua: `Коротке замикання датчика`,
        en: `Sensor short circuit`,
        ru: `Короткое замыкание датчика`,
      };
      break;
    case 13:
      res = { ua: `Обрив датчика`, en: `Sensor break`, ru: `Обрыв датчика` };
      break;
    case 14:
      res = {
        ua: `Відсутність зв'язку з АЦП `,
        en: `No communication with ADC`,
        ru: `Обрыв связи с АЦП`,
      };
      break;
    case 16:
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

// регістри зі значеннями аналогових входів
for (let i = 1; i < 9; i++) {
  driver.addRegister({
    id: `I${i}`,
    addr: 0x0001 + 6 * (i - 1),
    header: { ua: `Вхід${i}`, en: `Input${i}`, ru: `Вход${i}` },
    note: `Value${i}`,
    units: degC,
    _get: function (arg) {
      return _getFC3(this);
    },
    get_: function (arg) {
      let trace = 0,
        ln = `get_::`;
      if (trace) {
        log("i", ln, `arg=`);
        console.dir(arg);
      }
      let note, err;
      // якщо 3 байт не 0,
      if (arg[2] > 0) {
        //то помилка
        err = getNote(arg[3]);
        // console.log(err);
      } else {
        // все Ок
        err = null;
        note = this.note + ":Ok";
      }
      let data = toNumber(arg, this) / 10;
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

// ------- state -------------
module.exports = driver;
