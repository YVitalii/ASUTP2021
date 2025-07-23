const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
driver.printRegsDescription();
class ClassManager extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.driver = driver;
    props.ln = `MB1110-8A-Manager[${props.addr}]::`;
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
        obsolescence: 10,
        driverRegName: `I${i}`,
      }); // addRegister
    }
    log("w", this.ln, ` ==> Device was created`);
  } // constructor
}

module.exports = ClassManager;
