const ClassRegister = require("./ClassRegister.js");
const assert = require("assert");
const log = require("../../tools/log");

class ClassReg_timer extends ClassRegister {
  constructor(props = {}) {
    props.type = "timer";
    super(props);
    this.ln = "ClassReg_timer(" + this.id + ")::";
    let trace = 0,
      ln = this.ln + "constructor()::";
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }
    /** хв, мінімальне значення регістра */
    this.min = props.min || props.min === 0 ? props.min : 0;
    /** хв, максимальне значення регістра */
    this.max = props.max || props.max === 0 ? props.max : 99 * 60; //99годин
    /** хв, Значення */
    this.value = this.setValue(props.value);
  } // constructor
  setValue(val) {
    let trace = 0,
      ln = this.ln + `setValue(${val})::`;
    trace ? log("i", ln, `Started`) : null;
    let v = null;
    if (val === null || val === undefined || val === "") {
      v = 0;
      trace ? log("i", ln, `Value is not defined, was set v=`, v) : null;
    } else {
      trace ? log("i", ln, `Value is defined`) : null;
      v = Number(val);
      if (isNaN(v) && ("" + val).indexOf(":") > 0) {
        trace ? log("i", ln, ` Found symbol: ':'`) : null;
        let parts = ("" + val).split(":");
        if (trace) {
          log("i", ln, `parts=`);
          console.dir(parts);
        }
        if (parts.length >= 2) {
          v = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          if (isNaN(v)) {
            throw new Error(
              ln + `Невірний формат значення регістру таймера: val=${val} `
            );
          }
        } //
      } else {
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
} // class
module.exports = ClassReg_timer;

if (require.main === module) {
  //виконується, якщо модуль викликано окремо, а не імпортовано (в командному рядку)
  let regTime = new ClassReg_timer({ value: "12:34" });
  assert.equal(regTime.getValue(), 12 * 60 + 34);
  assert.equal(regTime.setValue(), 0);
  assert.equal(regTime.setValue(""), 0);
  assert.equal(regTime.setValue(null), 0);
  assert.equal(regTime.setValue("5:6"), 5 * 60 + 6);
  assert.equal(regTime.setValue(123), 123);
  assert.equal(regTime.setValue("345"), 345);
  assert.equal(regTime.setValue("99:99"), regTime.max);
  console.log("ClassReg_timer - all tests OK!");
}
