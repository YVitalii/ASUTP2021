const ClassRegister = require("./ClassRegister.js");

class ClassReg_number extends ClassRegister {
  constructor(props = {}) {
    props.type = "number";
    super(props);
    this.step = props.step;
    this.ln = "ClassReg_number(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** мінімальне значення регістра */
    this.min = props.min | (props.min === 0) ? props.min : 0;
    /** максимальне значення регістра */
    this.max = props.max | (props.max === 0) ? props.max : 100;
    this.value === undefined ? this.min : this.value;
  }
  setValue(val) {
    let ln = this.ln + `setValue():: Value = ${val}`;
    if (val > this.max) {
      this.log(
        "e",
        ` ${ln} is greater then max = ${this.max} !! Was setted val=this.max `
      );
    }
    if (val < this.min) {
      this.log(
        "e",
        ` ${ln} is lower then min = ${this.min} !! Was setted val=this.min `
      );
    }
    super.setValue(val);
  }
}
module.exports = ClassReg_number;
