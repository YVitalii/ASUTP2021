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
    props.ln = `MB110-8A-Manager`;
    props.header = { ua: `MB110-8A`, en: `MB110-8A`, ru: `MB110-8A` };
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
    let trace = 0,
      ln = this.ln + `getCompactHtml::`;
    if (trace) {
      log("i", ln, `props=`);
      console.dir(props);
    }

    let res = this.getAll();
    res.baseUrl = props.baseUrl + this.id + "/getRegs";
    res.regs = this.getRegsForHtml();
    // console.dir(res, { depth: 3 });
    let html = pug.renderFile(__dirname + "/views/main.pug", {
      device: this,
      prefix: props?.prefix || "",
      res,
    });

    return html;
  }
  getRegsForHtml(props) {
    let regs = {};
    for (const key in this.regs) {
      if (Object.prototype.hasOwnProperty.call(this.regs, key)) {
        regs[key] = this.regs[key].getAll();
      }
    } // for
    return regs;
  }

  getFullHtml() {
    return this.getCompactHtml();
  }
}

module.exports = ClassManager;

if (!module.parent) {
  // якщо запущено як окремий модуль
  let w2 = require("../../conf_iface.js").w2;
  let entity = new ClassManager({ iface: w2, id: "MB110-8A", addr: 16 });
  // console.dir(entity, { depth: 2 });
  console.dir(entity.getCompactHtml({ baseUrl: "/devices/OWEN_MB110-8A/" }));
  async function read() {
    let res = await entity.getParams("T1;T2;T3;T4;T5;T6;T7;T8");
    console.dir(res);
    setTimeout(read, 2000);
  }

  //read();
  //console.log(entity.getFullHtml());
}
