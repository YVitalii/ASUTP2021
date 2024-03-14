/** модуль склдає список всіх сутностей в що представлені в АСУТП */

const entities = {};
const pug = require("pug");
const log = require("../../tools/log");
const gln = __dirname + "index.js->";

// загальний опис
entities.about = {};
entities.about.fullName = {
  ua: `Список об'єктів`,
  en: `The list of Objects`,
  ru: `Список обьектов`,
};

// поки що костиль, потрібно зробити автоматичне сканування та додавання сутностей
// з теки з сутностями
//entities[`SShAM-7-12_2023`] = require("../SShAM-7-12_2023/entity.js");
entities[`SDO-15.15.15)5_2023`] = require("../SDO-15.15.15)5_2023/entity.js");

/** Функція повертає сторінку зі списком печей */
entities.about.htmlFull = (lang = "ua") => {
  let trace = 0,
    ln = gln + "entities.about.htmlFull()-> ";
  trace ? log("i", ln, `Started`) : null;
  let html = "";
  for (const entity in entities) {
    trace ? log("i", ln, `entity=`, entity) : null;
    if (Object.hasOwnProperty.call(entities, entity)) {
      if (entity == "about") continue;
      if (trace) {
        log("i", ln, `entities[entity]=`);
        console.dir(entities[entity]);
      }
      let element = entities[entity].htmlCompact(lang);

      html += `<! ----- ${entity}----- > \n ${element} \n<hr>\n`;
    }
  }
  html = pug.renderFile(__dirname + "/views/full.pug", {
    entities,
    html,
  });
  //console.log(html);
  return html;
};

module.exports = entities;

if (!module.parent) {
  console.log("----------------------------------------------------");
  console.log(entities.about.htmlFull());
}
