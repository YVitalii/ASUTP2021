const ClassGeneral = require("../../ClassGeneral");
const fs = require("fs").readdirSync;
const ds18b20 = require("ds18b20");

class Class_i2c extends ClassGeneral {
  constructor(params) {
    super(params);
    this.homePath = `\\sys\\`;
  } // constructor
} //Class_i2c
