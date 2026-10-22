const ClassRegister = require("./ClassRegister.js");

class ClassReg_number extends ClassRegister {
  constructor(props = {}) {
    const initialValue = props.value;
    // value застосується після min/max, інакше setValue у базі ще не бачить меж
    super({ ...props, type: "number", value: undefined });
    this.step = props.step;
    this.ln = props.ln ? props.ln : "ClassReg_number(" + this.id + ")::";
    /** null — величина з цього боку не обмежена */
    this.min = props.min === undefined ? null : props.min;
    this.max = props.max === undefined ? null : props.max;
    this.unit = props.unit ? props.unit : {ua:"", en:"", ru:""};
    const hasValue = initialValue !== undefined && initialValue !== null;
    this.setValue(hasValue ? initialValue : this.min);
  }
  setValue(val) {
    let ln = this.ln + `setValue():: Value = ${val}`;
    if (this.max !== null && val > this.max) {
      this.log(
        "e",
        ` ${ln} is greater then max = ${this.max} !! Was setted val=this.max `
      );
      val = this.max;
    }
    if (this.min !== null && val < this.min) {
      this.log(
        "e",
        ` ${ln} is lower then min = ${this.min} !! Was setted val=this.min `
      );
      val = this.min;
    }
    return super.setValue(val);
  }
}
module.exports = ClassReg_number;
