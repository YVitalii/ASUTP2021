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
            log(
              "w",
              `------------------- Server ip= ` +
                ip +
                "---------------------------------"
            );
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
// -------------  w2 two wire RS485 ------------------------
if (platform != "win32") {
  comName = "/dev/ttyUSB0";
  comId = comName.split("/")[2];
} else {
  comId = comName = "COM4";
}

const Iface = require("./rs485/class_RS485_iface.js");
let portId = "w2",
  portHeader = `${portId}(${comId})`;
// module.exports.path = comName;
ifaces.w2 = new Iface(comName, {
  baudRate: 2400,
  timeoutBetweenCalls: 200,
  id: "w2",
  header: { ua: portHeader, en: portHeader, ru: portHeader },
});

// -- w4 чотирьох провідна лінія ------------------
if (platform != "win32") {
  comName = "/dev/ttyUSB1";
  comId = comName.split("/")[2];
} else {
  comName = "COM4";
}
portId = "w4";
portHeader = `${portId}(${comId})`;
// module.exports.path = comName;
ifaces.w4 = new Iface(comName, {
  baudRate: 9600,
  timeoutBetweenCalls: 200,
  id: "w4",
  header: { ua: portHeader, en: portHeader, ru: portHeader },
});

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
