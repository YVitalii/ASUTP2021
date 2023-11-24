/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const pug = require("pug");
const entity = {};
const devices = require("./devices/devices.js");
const Program = require("./program/program/ClassProgram.js");

const log = require("../../tools/log.js");

let trace = 1,
  gln = "/SSham-7-12_2023/index.js::";
entity.fullName = "Піч азотування СШАМ-7.12/7";
entity.shortName = "СШАМ-7.12/7";
entity.id = "SShAM-7-12_2023";
entity.maxT = 700; // maximum

entity.homeUrl = entity.id + "/";
entity.devices = devices;
entity.controllers = require("./controllers/controllers.js");

entity.htmlCompact = () => {
  let trace = 1,
    ln = gln + "htmlComponent.compact::";
  // if (trace) {
  //   log("i", ln, `entity=`);
  //   console.dir(entity);
  // }
  //   trace ? log("i", ln, `entity=`, entity) : null;
  let html = pug.renderFile(__dirname + "/views/compact.pug", entity);
  // trace ? log("i", ln, `html=`, html) : null;
  return html;
};

entity.htmlFull = () => {
  let trace = 1,
    ln = gln + "htmlComponent.full::";
  //trace ? log("i", ln, `entity=`, entity) : null;
  let html = pug.renderFile(__dirname + "/views/full.pug", {
    entity,
    controllersButton: {
      href: entity.homeUrl,
      title: { ua: `Контролери`, en: `Controllers`, ru: `Контроллеры` },
    },
  });
  return html;
};

entity.router = require(__dirname + "\\routes\\entityRouter.js");

if (trace) {
  log("i", gln, `entity=`);
  console.dir(entity);
}
// тут зберігається програма
entity.program = new Program();

module.exports = entity;

if (!module.parent) {
  console.log("----------entity.js:: entity= ----------------------");
  console.dir(entity.process.fullHTML());
  //   console.dir(entity);
  //log(entity.html.compact());
  //log(entity.html.full());
}
