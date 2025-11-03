const Device = require("./fakeDevice_FlowRegulatorManager");
const assert = require("assert");
let trace = 1,
  ln = `${__filename}::`;
let props = {
  id: "fakeFlowMan_N2",
  addr: 2,
};
let dev = new Device(props);

assert.equal(dev.id, props.id);
assert.equal(dev.regs.flow.value, null);
// assert.equal(dev.flow.value, await dev.getFlow());
(async () => {
  let flow = 15;
  await dev.setFlow(15);
  assert.equal(flow, await dev.getFlow(), "Ok");
  await assert.rejects(dev.setFlow(), "setFlow(undefined) should reject!");
  assert.equal(
    dev.offLine,
    false,
    "Before set offline, device must be online!"
  );
  dev.setOffLine();
  assert.equal(dev.offLine, true);
  await assert.rejects(
    dev.setFlow(10),
    "When device is offline, setFlow() should throw error"
  );
  await assert.rejects(
    dev.getFlow(),
    "When device is offline, getFlow() should throw error"
  );
  dev.setOnLine();
  assert.equal(dev.offLine, false, "After set onLine, device must be online!");
})();

if (trace) {
  console.log(ln + `dev=`);
  console.dir(dev);
}
