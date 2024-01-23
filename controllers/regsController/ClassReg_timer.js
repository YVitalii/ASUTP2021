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
};
