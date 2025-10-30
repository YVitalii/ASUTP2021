const ClassRegister = require("./ClassRegister.js");

module.exports = class ClassReg_timer extends ClassRegister {
  constructor(props = {}) {
    props.type = "timer";
    super(props);
    this.ln = "ClassReg_timer(" + this.id + ")::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    /** хв, мінімальне значення регістра */
    this.min = props.min || props.min === 0 ? props.min : 0;
    /** хв, максимальне значення регістра */
    this.max = props.max || props.max === 0 ? props.max : 99 * 60; //99годин
    /** хв, Значення */
    this.value = this.setValue(props.value);
  } // constructor
  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})`;
    let v = null;
    if (val === null || val === undefined || val === "") {
      v = 0;
    } else {
      v = Number(val);
      if (!isNaN(v) && String(val).indexOf(":") > 0) {
        let parts = String(val).split(":");
        if (parts.length >= 2) {
          v = Number(parts[0]) * 60 + Number(parts[1]);
          if (isNaN) {
            throw new Error(
              ln + `Невірний формат значення регістру таймера: val=${val} `
            );
          }
        } //
      }
    }
    if (v < this.min) {
      v = this.min;
    }
    if (v > this.max) {
      v = this.max;
    }
    super.setValue(v);
    return v;
  } // setValue
}; // class

if (condition) {
}
