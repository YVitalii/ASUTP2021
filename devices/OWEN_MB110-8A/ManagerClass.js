const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config").units;
driver.printRegsDescription();
class ClassManager extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.driver = driver;
    super(props);
    for (let i = 1; i < 9; i++) {
      this.addRegister({
        id: `T${i}`,
        comment: {
          ua: `Температура вхід ${i}`,
          en: `Temperature of input ${i}`,
          ru: `Температура вход ${i}`,
        },
        units: units.degC,
        type: "number",
        min: -20,
        max: 1200,
        readonly: true,
        obsolescense: 10,
        driverRegName: `I${i}`,
      }); // addRegister
    }
  }
}

module.exports = ClassManager;
