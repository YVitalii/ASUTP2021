const ClassRegister = require("./ClassRegister.js");
/**
 * Регістр із вкладеним списком регістрів.
 */

module.exports = class ClassReg_regsList extends ClassRegister {
  /**
   * @param {Object} props
   * @property {Object} [props.regs={}] - вкладені регістри за ключем
   */

  constructor(props = {}) {
    props.type = props.type ? props.type : "regsList";
    super({ ...props });
    this.ln = props.ln ? props.ln : "ClassReg_regsList(" + this.id + ")::";
    const regs = props.regs;
    this.regs = regs && typeof regs === "object" ? { ...regs } : {};
  }
};
