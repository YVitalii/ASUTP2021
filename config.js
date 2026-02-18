const config = {};

// вмикає/вимикає емулятор послідовного порту  RS485
config.emulateRS485 = 1; //емуляція rs485;

// режим розробки всі періоди опитування зменшені
config.test = true; //false; //true;

// трасувальник
let trace = 0;
let title = "config.js::"; // загальний підпис
let ln = title;

config.units = {
  empty: { ua: ``, en: ``, ru: `` },
  degC: { ua: `°C`, en: `°C`, ru: `°C` },
  lpm: { ua: `л/хв`, en: `l/m`, ru: `л/мин` },
  m3ph: { ua: `м3/год`, en: `m3/h`, ru: `м3/ч` },
  percent: { ua: `%`, en: `%`, ru: `%` },
};

module.exports = config;
trace ? log("i", ln, `---------- Config.js loaded! --------------`) : null;

if (!module.parent) {
  console.dir(config, { depth: 4 });
}
