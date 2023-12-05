/**
 * Модуль перетворює регістр в HTML
 */

const pug = require("pug");
const log = require("../../tools/log");
const gln = module.file;

let viewsDir = require("path").normalize(__dirname + "\\views\\");

function regsRender(regs, prefix = "", lang = "ua") {
  let trace = 1,
    ln = gln + "regsRender()::";
  if (!regs) {
    console.error("Не вказані регістри");
  }
  let html = '<div class="row">\n';
  for (const key in regs) {
    if (regs.hasOwnProperty(key)) {
      trace ? log("i", ln, `reg=`, key) : null;
      html += regRender(regs[key], prefix, lang);
    }
  }
  html += `\n<div> <!-- container ${prefix}  --> `;
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

function regRender(reg, prefix = "", lang = "ua") {
  let trace = 1,
    ln = gln + "regRender()::";
  trace ? log("i", ln, `=`) : null;
  if (!reg) {
    console.error("Не вказаний регістр");
  }
  let file = reg.type + ".pug";
  let html = pug.renderFile(file, { reg, prefix, lang });
  html += "\n";

  return html;
}

module.exports = regsRender;
