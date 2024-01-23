const ClassRegister = require("./ClassRegister.js");

module.exports = class ClassReg_regsList extends ClassRegister {
  constructor(props = {}) {
    props.type = "regsList";
    super(props);
    this.ln = "ClassReg_regsList(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** список регістрів для вибору */
    this.regs = props.regs ? props.regs : {};
  }
};
