const Device = require("./fakeDevice_FlowRegulator");
let trace = 1,
  ln = `${__filename}::`;
let dev = new Device();

if (trace) {
  console.log(ln + `dev=`);
  console.dir(dev);
}
