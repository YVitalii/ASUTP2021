const FlowController = require("../../../controllers/flowController/classFlowController");
const devices = require("./devices");

const controllers = {};

let props = {
  regErr: { min: -5, max: +5 }, // %
  id: "NH3small",
  shortName: { ua: `NH3 мал.`, en: `NH3 small`, ru: `NH3 малый` },
  fullName: {
    ua: `Аміак. Мала витрата`,
    en: `Amonia. Small flow`,
    ru: `Аммиак. Малый поток`,
  },
  flowScale: { min: 0, max: 1.08 }, // m3/hour
  periodSets: { working: 5, waiting: 20 },
  errCounter: 10,
  getValue: async () => {
    return await devices.A22.getAI();
  },
  setValue: async () => {
    return await devices.A22.setAO();
  },
};

controllers.NH3small = new FlowController(props);

props = {
  regErr: { min: -5, max: +5 }, // %
  id: "NH3big",
  shortName: { ua: `NH3 вел.`, en: `NH3 big`, ru: `NH3 бол.` },
  fullName: {
    ua: `Аміак. Велика витрата`,
    en: `Amonia. Bigger flow`,
    ru: `Аммиак. Большой поток`,
  },
  flowScale: { min: 0, max: 3 }, // m3/hour
  periodSets: { working: 5, waiting: 20 },
  errCounter: 10,
  getValue: async () => {
    return await devices.A24.getAI();
  },
  setValue: async () => {
    return await devices.A24.setAO();
  },
};
controllers.NH3big = new FlowController(props);

props = {
  regErr: { min: -5, max: +5 }, // %
  id: "N2",
  shortName: { ua: `N2`, en: `N2`, ru: `N2` },
  fullName: {
    ua: `Азот`,
    en: `Nitrogen`,
    ru: `Азот`,
  },
  flowScale: { min: 0, max: 3 }, // m3/hour
  periodSets: { working: 5, waiting: 20 },
  errCounter: 10,
  getValue: async () => {
    return await devices.A24.getAI();
  },
  setValue: async () => {
    return await devices.A24.setAO();
  },
};

console.log("============= Controllers = ");
console.dir(controllers, { depth: 2 });

controllers.N2 = new FlowController(props);

module.exports.controllers = controllers;
