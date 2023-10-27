/** Збирає і налаштовує всі елементи сутності, та передає менеджеру сутностей */
const pug = require("pug");
const entity = {};
const log = require("../../tools/log.js");
let trace = 1,
  gln = "/SSham-7-12_2023/index.js::";
entity.fullName = "Піч азотування СШАМ-7.12/7. Інв №????";
entity.shortName = "СШАМ-7.12/7";
entity.id = "SShAM-7-12_2023";
entity.devices = require("./config/devices.js");
entity.controllers = require("./controllers/index.js");
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
  //   trace ? log("i", ln, `entity=`, entity) : null;
  let html = pug.renderFile(__dirname + "/views/full.pug", entity);
  return html;
};

module.exports = entity;

if (!module.parent) {
  console.log("--------------------------------");
  //   console.dir(entity);
  log(entity.html.compact());
  log(entity.html.full());
}
