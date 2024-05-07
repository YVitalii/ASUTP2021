const log = require("../../tools/log.js");
const pug = require("pug");
const resolvePath = require("path").resolve;

module.exports = class ReportManagerClass {
  /**
   *
   * @param {*} props
   * @prop {Object} props.loggerManager - менеджер логування
   *
   */
  constructor(props = {}) {
    this.ln = props.loggerManager.ln + "ReportManagerClass()::";
    // this.loggerManager = props.loggerManager;
    this.baseDir = props.homeDir;
    this.baseUrl = (props.homeUrl ? props.homeUrl : "") + "/reports";
  }

  getPugTemplateDir(req) {
    return resolvePath(
      req.locals.homeDir + "/controllers/reportsManager/views/"
    );
  }

  getCompactHtml(req) {
    const pugTemplate = this.getPugTemplateDir(req) + "/reportCompact.pug";
    trace ? log("i", ln, `pugTemplateDir=`, pugTemplate) : null;
    return this.getFullHtml(req);
  }
  getFullHtml(req) {
    let trace = 1,
      ln = this.ln + `getFullHtml(${req.entity.id})`;
    const pugTemplate = this.getPugTemplateDir(req) + "/reportFull.pug";
    trace ? log("i", ln, `pugTemplateDir=`, pugTemplate) : null;
    let html = "";
    let lang = req.user.lang;
    html = html = pug.renderFile(pugTemplate, {
      lang,
      pageTitle: {
        ua: `Генератор звітів`,
        en: `Reports manager`,
        ru: `Генератор отчетов`,
      },
      logger: req.entity.loggerManager,
      entityHeader: req.entity.fullName,
      report: this,
      homeUrl: this.baseUrl,
    });
    return html;
  }
};
