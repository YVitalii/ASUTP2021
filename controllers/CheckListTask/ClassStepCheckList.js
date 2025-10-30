const ClassStepGeneral = require("../ClassStep/ClassStepGeneral.js");

class ClassCheckListStep extends ClassStepGeneral {
  constructor(props = {}) {
    
  }
  finishSygnal(msg) {
    let trace = 1,
      ln = `CheckListClass::finishSygnal::${this.id}::`;
    this.logger("w", ln, `CheckList finished`);
    this.finish();
    return 1;
  }
}

module.exports = ClassCheckListStep;
