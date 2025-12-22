// створюємо інтерфейс

const IfaceClass = require("../class_RS485_iface_emulator");
const iface = new IfaceClass(
  "fakeCOM",
  (props = { id: "COM3", baudRate: 2600 }),
  (timeout = 300)
);
console.log("iface=");
console.dir(iface, { depth: 2 });

// створюємо емулятор приладу

const ClassFakeDevice = require("./fakeDevice.js");
const dev = new ClassFakeDevice({
  id: "fakeTrp",
  header: { ua: ``, en: ``, ru: `` },
  comment: { ua: ``, en: ``, ru: `` },
});

dev;
console.log("dev=");
console.dir(dev, { depth: 2 });
