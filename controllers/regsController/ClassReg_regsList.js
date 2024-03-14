const ClassRegister = require("./ClassRegister.js");
/**
 * Створює регістр в якому є вкладений список регістрів
 */

module.exports = class ClassReg_regsList extends ClassRegister {
  /**
   *
   * @param {Object} props
   * @property {String} props.regs={} - список регістрів
   */

  constructor(props = {}) {
    props.type = "regsList";
    super(props);
    //this.ln = this.ln ? this.ln :"ClassReg_regsList(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** список регістрів для вибору */
    this.regs = props.regs ? props.regs : {};
  }
};
