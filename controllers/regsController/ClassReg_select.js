const ClassReg_regsList = require("./ClassReg_regsList.js");

class ClassReg_select extends ClassReg_regsList {
  constructor(props = {}) {
    props.type = props.type ? props.type : "select";
    super(props);
    this.ln = "ClassReg_select(" + this.id + ")::";
    if (this.value === undefined) {
    }
    this.type = "select";
    let trace = 1,
      ln = this.ln + "constructor()::";
  }
}

module.exports = ClassReg_select;
