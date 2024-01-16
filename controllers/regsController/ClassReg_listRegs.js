const ClassRegister = require("./ClassRegister.js");

class ClassReg_select extends ClassRegister {
  constructor(props = {}) {
    props.type = "listRegs";
    props.value = null;
    super(props);
    this.ln = "ClassReg_listRegs(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** список регістрів для вибору */
    this.regs = props.regs ? props.regs : {};
  }
}

module.exports = ClassReg_select;
