/**
 * Модуль перетворює регістр в HTML
 */

const pug = require("pug");
const log = require("../../tools/log");
const gln = __dirname + "::";

let viewsDir = require("path").normalize(__dirname + "\\views\\");

/**
 * Перетворює список регістрів в елементи DOM
 * @param {*} regs - список регістрів
 * @param {*} props - список налаштувань
 * @property {String}  props.prefix - префікс для формування id елементу в DOM-tree
 * @property {String}  props.homeUrl - базова адреса для POST запиту стану регістрів використовується в скрипті авт. опитування
 * @returns
 */

function regsRender(regs, props = {}) {
  let trace = 1,
    ln = gln + "regsRender()::";
  if (!regs) {
    console.error("Не вказані регістри");
  }
  let prefix = props.prefix ? props.prefix : "undefinedPrefix_";
  let language = props.lang ? props.lang : "undefinedLanguage";

  let file = viewsDir + "header.pug";
  let html = '<div class="row">';
  html += pug.renderFile(file, { prefix, language });

  for (const key in regs) {
    if (regs.hasOwnProperty(key)) {
      trace ? log("i", ln, `reg=`, key, ":", regs[key]) : null;
      html += regRender(regs[key], prefix, language);
      html += "\n";
    }
  }
  html += "</div>";

  return html;
}

/**
 *
 * @param {Object} reg об'єкт регистру
 * @property {String} reg.id ідентифікатор регистру
 * @property {String} reg.header Заголовок регистру
 * @property {String} reg.type тип регистру
 * @property {String|Number|Array} reg.value значення регистру
 * @property {Object} reg.title {ua:"",en:"",ru:""} опис регистру
 * @property {String} reg.min - мінімальне значення
 * @property {String} reg.max - максимальне значення
 * @param {String} prefix - префікс назви регістру
 */

function regRender(reg, prefix = "", language = "ua") {
  let trace = 0,
    ln = gln + "regRender()::";
  trace ? log("i", ln, `=`) : null;
  if (!reg) {
    console.error("Не вказаний регістр");
  }
  let file = viewsDir + reg.type + ".pug";
  let html = pug.renderFile(file, { reg, prefix, language });
  return html;
}

module.exports = regsRender;
