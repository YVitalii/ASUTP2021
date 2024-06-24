/** типовий регістр драйвера  */

module.exports = class ClassDriverRegisterGeneral {
  constructor(props)  {
    // -------- 
    if (!props.regName) {
      throw new Error("'regName' must be defined!");
    }
    this.regName = props.regName;
    // -------- 
    if (!props.addr) {
      throw new Error("'addr' of register must be defined!");
    }
    this.addr = props.addr;

    // -------- 
    if (!props.header) {
      throw new Error("'header' of register must be defined!");
    }
    this.header = props.header;

    // --------
    this.units = props.units ? props.units : "";

  }
};
