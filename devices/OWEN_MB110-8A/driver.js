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
  let trace = 1,
    ln = env.ln + `toNumber():id=${env.id}::`;
  trace ? log("i", ln, `data=${data}`) : null;
  console.dir(data);
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
  id: "MB110-8A",
  header: { ua: `MB110-8A`, en: `MB110-8A`, ru: `MB110-8A` },
  comment: {
    ua: `Модуль аналового вводу`,
    en: `Analog Input Module`,
    ru: `Модуль аналогового ввода`,
  },
  timeout: 2000,
});

// регістри зі значеннями аналогових входів
for (let i = 1; i < 9; i++) {
  driver.addRegister({
    id: `T${i}`,
    addr: 0x0001 + 6 * (i - 1),
    header: { ua: `Вхід${i}`, en: `Input${i}`, ru: `Вход${i}` },
    note: `Value${i}`,
    units: degC,
    _get: function (arg) {
      return _getFC3(this);
    },
    get_: function (arg) {
      let data = toNumber(arg, this) / 10;
      return { value: data, note: this.note };
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
