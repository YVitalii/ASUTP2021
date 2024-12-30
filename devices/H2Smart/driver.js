/** Опис регістрів */
/** Детально: .\_SWdrawings\Модернизация\ХТО\_Информация\Nitrex_UPC-group\Азотування\H2-smart */
const { units } = require("../../config");
const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");
const { degC, lpm, m3ph, percent } = require("../../config.js").units;

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
  let value;
  if (Buffer.isBuffer(data)) {
    value = data.readUInt16BE(data);
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
  id: "H2smart",
  header: { ua: `H2-smart`, en: `H2-smart`, ru: `H2-smart` },
  comment: {
    ua: `Дисоціометр аміаку`,
    en: `Dissociation meter of ammonia`,
    ru: `Дисоциометр амиака`,
  },
  timeout: 3000,
});

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

// ========= register descriptions ===============

// ------- state -------------
driver.addRegister({
  id: "Dissociation",
  addr: 0x0000,
  header: { ua: `Дисоціація`, en: `Dissociation`, ru: `Диссоциация` },
  note: `Dissociation in %`,
  units: percent,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- flowRate -------------
driver.addRegister({
  id: "flowRate",
  addr: 0x0001,
  header: { ua: `Поток газу`, en: `Flow rate`, ru: `Поток газа` },
  note: `Flow rate in l/m`,
  units: lpm,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.001;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- blockT -------------
driver.addRegister({
  id: "blockT",
  addr: 0x0003,
  header: {
    ua: `Температура блоку`,
    en: `Block temperature`,
    ru: `Температура блока`,
  },
  note: `Measurement block temperature [°C]`,
  units: degC,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- Kn  -------------
driver.addRegister({
  id: "Kn",
  addr: 0x0028,
  header: {
    ua: `Азотний потенціал`,
    en: `Nitriding potential`,
    ru: `Азотный потенциал`,
  },
  note: `Nitriding potential, %`,
  units: percent,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- T -------------
driver.addRegister({
  id: "T",
  addr: 0x0038,
  header: {
    ua: `Температура термопари`,
    en: `Thrermocouple temperature`,
    ru: `Температура термопары`,
  },
  note: `Thrermocouple temperature [°C]`,
  units: degC,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- Kс -------------
driver.addRegister({
  id: "Kс",
  addr: 0x0048,
  header: {
    ua: `Вуглецевий потенціал`,
    en: `Carburizing potential`,
    ru: `Углеродный потенциал`,
  },
  note: `Carburizing potential, %`,
  units: percent,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    readOnly(this);
  },
  set_: function (arg) {
    readOnly(this);
  },
});

// ------- enableSampling -------------
driver.addRegister({
  id: "enableSampling",
  addr: 0x0009,
  header: {
    ua: `Дозвіл на забір проб`,
    en: `Enable sampling`,
    ru: `Разрешение на забор проб`,
  },
  note: `Enable sampling. Every 10..80s must be setted to "1"`,
  _get: function (arg) {
    // Byte type
    let res = _getFC3(this);
    res.data = 0x1;
    return res;
  },
  get_: function (arg) {
    let data = toNumber(arg, this);
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    let err;
    arg = toNumber(arg, this);
    if (arg === 1 || arg === 0) {
      err = null;
      arg = {
        FC: 6,
        addr: this.addr,
        data: arg,
      };
    } else {
      err = new Error(
        `Invalid parameter for writing: ${arg} (allowed: 1 / 0 - Enable sampling)`
      );
      arg = null;
    }
    return { err, data: { FC: 6, addr: this.addr, data: arg } };
  },
  set_: function (arg) {
    let data = toNumber(arg, this);
    return { value: data, note: this.note };
  },
});

let obj = {
  units: m3ph,
  _get: function (arg) {
    return _getFC3(this);
  },
  get_: function (arg) {
    let data = toNumber(arg, this) * 0.01;
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    arg = toNumber(arg, this);
    arg = arg * 1000;
    return {
      data: { FC: 6, addr: this.addr, data: arg },
      err: null,
    };
  },
  set_: function (arg) {
    let data = toNumber(arg, this);
    return { value: data, note: this.note };
  },
};

// ------- flowN2 -------------
driver.addRegister(
  Object.assign(
    {
      id: "flowN2",
      addr: 0x0010,
      header: { ua: `Витрата N2`, en: `Flow N2`, ru: `Расход N2` },
      note: `Process gas 1 [Nitrogen] flow value in m3/h`,
    },
    obj
  )
);

// ------- flowNH3 -------------
driver.addRegister(
  Object.assign(
    {
      id: "flowNH3",
      addr: 0x0011,
      header: { ua: `Витрата NH3`, en: `Flow NH3`, ru: `Расход NH3` },
      note: `Process gas 2 [Ammonia] flow value in m3/h`,
    },
    obj
  )
);

// ------- flowNH3 -------------
driver.addRegister(
  Object.assign(
    {
      id: "flowCO2",
      addr: 0x0013,
      header: { ua: `Витрата CO2`, en: `Flow CO2`, ru: `Расход CO2` },
      note: `Process gas 4 [Carbon Dioxide] flow value in m3/h`,
    },
    obj
  )
);

// ------- resetModel -------------

driver.addRegister({
  id: "resetModel",
  addr: 0x00018,
  header: {
    ua: `Скидання математичної моделі печі`,
    en: `Reinitialize furnace model calculations`,
    ru: `Обнуление математической модели печи`,
  },
  note: `Reinitialize furnace model calculations (1=activate)`,
  _get: function (arg) {
    // Byte type
    let res = _getFC3(this);
    res.data = 0x1;
    return res;
  },
  get_: function (arg) {
    let data = toNumber(arg, this);
    return { value: data, note: this.note };
  },
  _set: function (arg) {
    let err;
    arg = toNumber(arg, this);
    if (arg === 1 || arg === 0) {
      err = null;
      arg = {
        FC: 6,
        addr: this.addr,
        data: arg,
      };
    } else {
      err = new Error(
        `Invalid parameter for writing: ${arg} (allowed: 1 / 0 - Enable sampling)`
      );
      arg = null;
    }
    return { err, data: { FC: 6, addr: this.addr, data: arg } };
  },
  set_: function (arg) {
    let data = toNumber(arg, this);
    return { value: data, note: this.note };
  },
});

if (require.main === module) {
  console.log(`This is a module!`);
  //console.dir(driver);
  driver.printRegsDescription();
}
