const ClassRegister = require("./ClassRegister.js");

class ClassReg_select extends ClassRegister {
  constructor(props = {}) {
    props.type = props.type ? props.type : "select";
    props.value = props.value ? props.value : 0;
    super(props);
    this.ln = "ClassReg_select(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** список регістрів для вибору */
    this.regs = props.regs ? props.regs : {};
  }
}

module.exports = ClassReg_select;
