let comName = "";
let platform = process.platform;
let ifaces = {};
const log = require("./tools/log.js");
let trace = 0,
  ln = __filename + "::";

{
  /// ----------- server ip-address ----------------
  const networkInterfaces = require("os").networkInterfaces;
  let ln = "Get my IP::";
  let interfaces = networkInterfaces();
  if (trace) {
    log("i", ln, `interfaces=`);
    console.dir(interfaces);
  }
  for (const key in interfaces) {
    if (Object.hasOwnProperty.call(interfaces, key)) {
      if (key != "Ethernet" && key != "eth0") {
        trace ? log("i", ln, `Skip: key=`, key) : null;
        continue;
      }
      const interface = interfaces[key];
      for (let i = 0; i < interface.length; i++) {
        const element = interface[i];
        if (!element.internal) {
          let ip = element.address;
          trace ? log("i", ln, `family= ${element.family}; ip=${ip}`) : null;
          if (element.family == "IPv4") {
            log("w", `Server ip= ` + ip);
            ifaces.ipAddr = ip;
            // break;
          }
        }
      }
    }
  }
  //module.exports.ipAddr = "192.168.1.147"; // IP адреса в локальній мережі
}

let comId;

if (platform != "win32") {
  comName = "/dev/ttyUSB0";
  comId = comName.split("/")[2];
} else {
  comId = comName = "COM4";
}

const Iface = require("./rs485/class_RS485_iface.js");

// module.exports.path = comName;
ifaces.w2 = new Iface(comName, {
  baudRate: 2400,
  timeoutBetweenCalls: 100,
  id: comId,
  header: { ua: `${comId}`, en: `${comId}`, ru: `${comId}` },
});

if (trace) {
  log("i", ln, `ifaces=`);
  console.dir(ifaces);
}

module.exports = ifaces;

// -- чотирьох провідна лінія ------------------
// if (platform != "win32") {
//   comName = "/dev/ttyUSB1";
// } else {
//   comName = "COM4";
// }

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
