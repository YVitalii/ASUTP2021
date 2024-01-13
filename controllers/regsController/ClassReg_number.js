const ClassRegister = require("./ClassRegister.js");

class ClassReg_number extends ClassRegister {
  constructor(props = {}) {
    props.type = "number";
    super(props);
    this.ln = "ClassReg_select(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** мінімальне значення регістра */
    this.min = props.min | (props.min === 0) ? props.min : 0;
    /** максимальне значення регістра */
    this.max = props.max | (props.max === 0) ? props.max : 100;
  }
}
module.exports = ClassReg_number;
