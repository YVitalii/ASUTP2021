const ClassDevManagerGeneral = require("../classDeviceGeneral/ClassDevManagerGeneral.js");
const iface = require("../../rs485/class_RS485_emulator.js");
const dummy = require("../../tools/dummy.js").dummyPromise;
const ClassFakeDriver = require("../classDeviceGeneral/ClassDriver_Fake.js");

class FlowRegulatorManager extends ClassDevManagerGeneral {
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
      _set: (v) => {
        return v;
      },
      set_: (v) => {
        return v;
      },
      _get: (v) => {
        return v;
      },
      get_: (v) => {
        return v;
      },
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
      obsolescense: 1,
      driverRegName: "AO1",
    });
    this.offLine = false;
  } //constructor

  isOffLine() {
    if (this.offLine) {
      throw new Error("Timeout error!!!");
    }
    return false;
  }

  async getFlow() {
    await dummy(100);
    this.isOffLine();
    return this.regs.flow.value;
  }

  async setFlow(val = null) {
    let trace = 1,
      ln = this.ln + `setFlow(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    await dummy(100);
    if (val === null) {
      throw new Error("Wrong value! Не вказано потік!!!");
    }
    this.isOffLine();
    this.regs.flow.value = parseInt(val);
    return this.regs.flow.value;
  }

  /**
   * Імітує зникнення зв'язку з приладом
   */
  setOffLine() {
    this.offLine = true;
  }

  setOnLine() {
    this.offLine = false;
  }

  async stop() {
    let trace = 1,
      ln = this.ln + `stop()::`;
    trace ? console.log(ln + `Started`) : null;
    await this.setFlow(0);
  }
  async start(val) {
    let trace = 1,
      ln = this.ln + `start(${val})::`;
    trace ? console.log(ln + `Started`) : null;
    await this.setFlow(val);
  }
} // class
module.exports = FlowRegulatorManager;
