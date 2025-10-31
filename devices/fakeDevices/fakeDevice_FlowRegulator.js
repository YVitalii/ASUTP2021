const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const iface = require("../../rs485/class_RS485_emulator.js");
const dummy = require("../../tools/dummy.js").dummyPromise;
const ClassFakeDriver = require("../classDeviceGeneral/ClassDriver_Fake.js");

class ClassFakeDevice_FlowRegulator extends ClassDevManagerGeneral {
  constructor(props = {}) {
    props.id = "fakeFlowRegManager";
    props.iface = iface;
    props.addr = 1;
    props.driver = new ClassFakeDriver();
    props.driver.addRegister({
      id: "AO1",
      addr: 0x0001,
      header: { ua: `Вхід1`, en: `Input1`, ru: `Вход1` },
      note: `Value1`,
      units: "%",
    });
    super(props);
    this.addRegister({
      id: "flow",
      comment: { ua: `Потік`, en: `Flow`, ru: `` },
      units: "%",
      type: "number",
      min: 0,
      max: 100,
      readonly: false,
      obsolescense: 10,
      driverRegName: "AO1",
    });
  } //constructor
  async getFlow() {
    await dummy(100);
    return this.regs.flow.value;
  }
  async setFlow(val) {
    await dummy(100);
    this.regs.flow.value = parseInt(val);
  }
  async stop() {
    await this.setFlow(0);
  }
  async start(val) {
    await this.setFlow(val);
  }
} // class
module.exports = ClassFakeDevice_FlowRegulator;
