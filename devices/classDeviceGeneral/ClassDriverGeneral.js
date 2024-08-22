/** типовий драйвер приладу */

// запуск тестів
// mocha  ../tests/t_createDriverGeneral.js -w

const ClassGeneral = require("../../ClassGeneral");
const ClassDriverRegisterGeneral = require("./ClassDriverRegisterGeneral");

module.exports = class ClassDriverGeneral extends ClassGeneral {
  constructor(props) {
    super(props);
    // обєкт зі списком регістрів
    this.regs = new Map();
  }

  addRegister(props) {
    let ln = "this.ln" + addRegister() + "::",
      trace = 1;
    let reg = new ClassDriverRegisterGeneral(props);
    if (trace) {
      log("i", ln, `reg=`);
      console.dir(reg);
    }
    if (this.regs.has(reg.id)) {
      throw new Error(
        `Register ${reg.id} alredy was declared! Try different "id".`
      );
    }
    this.regs.set(reg.id, reg);
    return true;
  }
};
