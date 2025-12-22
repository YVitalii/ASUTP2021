const config = {};

// включает/выключает  эмуляцию обмена по RS485

config.emulateDevices = 1;
config.emulateRS485 = config.emulateDevices; // для сумісності
// режим розробки
// якщо встановлено в true - використовується менший час затримок, таймаутів і періодів опитування
config.development = process.env.NODE_ENV !== "production"; // режим розробки

// режим розробки всі періоди опитування зменшені
config.test = true; //false; //true;

// трасувальник
let trace = 0;
let title = "config.js::"; // загальний підпис
let ln = title;

config.units = {
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
