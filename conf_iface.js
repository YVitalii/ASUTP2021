let platform = process.platform;
let ifaces = {};
const log = require("./tools/log.js");
let trace = 0,
  ln = __filename + "::";
const { emulateDevices } = require("./config.js");

// -------------- get my IP address ------------------
const os = require("os");

function getPublicIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Пропускаємо внутрішні та IPv6 адреси
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "IP-адресу не знайдено";
}

ifaces.ipAddr = getPublicIpAddress();
console.log(`Поточна публічна IP-адреса сервера: ${ifaces.ipAddr}`);

// -------------  w2 two wire RS485 ------------------------

let comId, comName;

if (emulateDevices) {
  comId = comName = "fake";
} else {
  if (platform != "win32") {
    comName = "/dev/ttyUSB0";
    comId = comName.split("/")[2];
  } else {
    comId = comName = "COM14";
  }
}

const Iface = emulateDevices
  ? require("./rs485/class_RS485_iface_emulator.js")
  : require("./rs485/class_RS485_iface_real.js");

let portId = "w2",
  portHeader = `${portId}(${comId})`;
// module.exports.path = comName;
let props = {
  baudRate: 2400,
  timeoutBetweenCalls: 200,
  id: "w2",
  header: { ua: portHeader, en: portHeader, ru: portHeader },
};
// console.dir(props);
ifaces.w2 = new Iface(comName, props, 700);

// // -- w4 чотирьох провідна лінія ------------------
// if (platform != "win32") {
//   comName = "/dev/ttyUSB1";
//   comId = comName.split("/")[2];
// } else {
//   comName = "COM4";
// }
// portId = "w4";
// portHeader = `${portId}(${comId})`;
// // module.exports.path = comName;
// ifaces.w4 = new Iface(comName, {
//   baudRate: 9600,
//   timeoutBetweenCalls: 200,
//   id: "w4",
//   header: { ua: portHeader, en: portHeader, ru: portHeader },
// });

if (trace) {
  log("i", ln, `ifaces=`);
  console.dir(ifaces);
}

module.exports = ifaces;

if (!module.parent) {
  console.dir("----------- ifaces =  ---------------");
  console.dir(ifaces, { depth: 2 });
}

// module.exports.w4 = new Iface(comName, {
//   baudRate: 2400,
//   timeoutBetweenCalls: 100,
// });

// Застарівша версія налаштування потрібні для RS485_v200.js
// параметры последовательного порта
// const connection = {
//   path: comName, //путь к последовательному порту
//   openOptions: {
//     // параметры порта
//     baudRate: 2400, // скорость бод
//   },
//   timeoutBetweenCalls: 300, // пауза между запросами, мс т.к. ТРП-08 тупят, то бывает начинают отвечать после timeout и начинают сбивать все передачи
// }; // connection

// module.exports = connection;
