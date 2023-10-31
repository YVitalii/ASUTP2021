const FlowController = require("../../../controllers/flowController/classFlowController");
const devices = require("../config/devices");
const controllers = {};
const log = require("../../../tools/log.js");
let trace = 1,
  gln = "/SSham-7-12_2023/controllers/index.js::";
const pug = require("pug");

controllers.about = {};
controllers.about.fullName = {
  ua: `Список контролерів`,
  en: `List of controllers`,
  ru: `Спписок контролеров`,
};

// -------------- NH3small -------------------------
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
  getDevicePV: async () => {
    return await devices.A22.getAI();
  },
  setDeviceSP: async () => {
    return await devices.A22.setAO();
  },
};

controllers.NH3small = new FlowController(props);

// -------------- NH3big -------------------------
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
  getDevicePV: async () => {
    return await devices.A24.getAI();
  },
  setDeviceSP: async () => {
    return await devices.A24.setAO();
  },
};

controllers.NH3big = new FlowController(props);

// -------------- N2 -------------------------
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
  getDevicePV: async () => {
    return await devices.A24.getAI();
  },
  setDeviceSP: async () => {
    return await devices.A24.setAO();
  },
};
controllers.N2 = new FlowController(props);

// console.log("============= Controllers = ");
// console.dir(controllers, { depth: 2 });

controllers.about.htmlFull = () => {
  let html = "";

  for (let controler in controllers) {
    // console.log("--------- iteration ----------");
    // console.dir(controler);
    if (controllers.hasOwnProperty(controler)) {
      if (controler == "about") {
        continue;
      }
      // отримуємо компонент
      let element = controllers[controler].htmlFull();

      //console.dir(controllers[controler].shortName);
      html += element + "<hr>";
    }
    // html += pug.renderFile("./views/full.pug", controllers);
  }
  html = pug.renderFile(__dirname + "/views/full.pug", {
    about: controllers.about,
    html: html,
  });

  return html;
};

module.exports = controllers;

if (!module.parent) {
  console.log("--------------------------------");
  let entity = controllers;
  //   console.dir(entity);
  // log(entity.html.compact());
  const save = require("fs").writeFile;
  save(
    __dirname + "/tests/index.html",
    entity.about.htmlFull(),
    {
      encoding: "utf8",
      flag: "w",
    },
    (err) => {
      if (err) console.log(err);
      else {
        console.log("File " + " written successfully");
      }
    }
  ); //save();

  log();
}
