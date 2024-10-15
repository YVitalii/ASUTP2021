// привязка id до адреси пристрою, поки костиль, потім буде виправлено
let ids = {};
let obsolescence = 10; //30;

module.exports.ids = {
  "28-031680112cff": "fermTank01",
  "28-031780112cff": "fermTank02",
};
module.exports.regs = {
  fermTank01: {
    id: "fermTank01",
    units: { ua: `°C`, en: `°C`, ru: `°C` },
    type: "number",
    min: 0,
    max: 125,
    obsolescence,
    header: { ua: `брЕмн1`, en: `fermTank1`, ru: `брЕмк1` },
    comment: {
      ua: `Температура в бродильному баку 1`,
      en: `Temperature in fermenting tank 1`,
      ru: `Температура в бродильном баке 1`,
    },
  },
  fermTank02: {
    id: "fermTank02",
    units: { ua: `°C`, en: `°C`, ru: `°C` },
    type: "number",
    min: 0,
    max: 125,
    obsolescence,
    header: { ua: `брЕмн2`, en: `fermTank2`, ru: `брЕмк2` },
    comment: {
      ua: `Температура в бродильному баку 2`,
      en: `Temperature in fermenting tank 2`,
      ru: `Температура в бродильном баке 2`,
    },
  },
};
