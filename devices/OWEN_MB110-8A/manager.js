const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const driver = require("./driver.js");
const log = require("../../tools/log.js");
const pug = require("pug");
const { dummyPromise } = require("../../tools/dummy.js");
const units = require("../../config.js").units;
// driver.printRegsDescription();
class ClassManager extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.driver = driver;
    props.ln = `MB1110-8A-Manager`;
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
  getCompactHtml(props) {
    let html = pug.renderFile(__dirname + "/views/main.pug", {
      device: this,
      prefix: props?.prefix || "",
    });
    return html;
  }
  getFullHtml() {
    return this.getCompactHtml();
  }
}

module.exports = ClassManager;

if (!module.parent) {
  // якщо запущено як окремий модуль
  let entity = new ClassManager({ id: "MB110-8A" });
  console.dir(entity);
}
